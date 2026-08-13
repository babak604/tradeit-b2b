use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("Es7dux19AYKphx5PtTn7vsem96pqTBKc6oQp9gosfERi");

#[program]
pub mod tradeit_escrow {
    use super::*;

    /// Initialize Multi-Party Escrow Vault for a Circular Deal
    pub fn initialize_cycle_escrow(
        ctx: Context<InitializeCycleEscrow>,
        deal_id: String,
        cycle_capacity_lamports: u64,
    ) -> Result<()> {
        require!(deal_id.len() <= 32, EscrowError::DealIdTooLong);

        let escrow_account = &mut ctx.accounts.escrow_account;
        escrow_account.initializer = ctx.accounts.initializer.key();
        escrow_account.deal_id = deal_id;
        escrow_account.cycle_capacity = cycle_capacity_lamports;
        escrow_account.is_locked = true;
        escrow_account.is_settled = false;
        escrow_account.bump = ctx.bumps.escrow_account;

        msg!("TradeIt Escrow Vault Initialized for Deal: {}", escrow_account.deal_id);
        Ok(())
    }

    /// Deposit Tokenized RWA or SPL Asset into Vault
    pub fn deposit_rwa_token(ctx: Context<DepositRwaToken>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.depositor_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.depositor.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::transfer(cpi_ctx, amount)?;
        msg!("RWA Token Deposited into TradeIt Escrow Vault");
        Ok(())
    }

    /// Atomic Settlement: Release Vaulted RWA Assets to Final Cycle Receiver
    pub fn execute_atomic_ring_settlement(
        ctx: Context<ExecuteRingSettlement>,
        amount: u64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow_account;
        require!(escrow.is_locked, EscrowError::EscrowNotLocked);
        require!(!escrow.is_settled, EscrowError::AlreadySettled);

        // CPI Signer seeds for Escrow PDA
        let deal_id_bytes = escrow.deal_id.as_bytes();
        let seeds = &[
            b"escrow",
            deal_id_bytes,
            &[escrow.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        // Transfer tokens from Vault PDA to Recipient
        let cpi_accounts = Transfer {
            from: ctx.accounts.vault_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: escrow.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);

        token::transfer(cpi_ctx, amount)?;

        escrow.is_settled = true;
        escrow.is_locked = false;

        msg!("Atomic Multi-Party Settlement Complete for Cycle: {}", escrow.deal_id);
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct CycleEscrowAccount {
    pub initializer: Pubkey,
    #[max_len(32)]
    pub deal_id: String,
    pub cycle_capacity: u64,
    pub is_locked: bool,
    pub is_settled: bool,
    pub bump: u8,
}

#[derive(Accounts)]
#[instruction(deal_id: String)]
pub struct InitializeCycleEscrow<'info> {
    #[account(
        init,
        payer = initializer,
        space = 8 + CycleEscrowAccount::INIT_SPACE,
        seeds = [b"escrow", deal_id.as_bytes()],
        bump
    )]
    pub escrow_account: Account<'info, CycleEscrowAccount>,
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositRwaToken<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub depositor_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        constraint = vault_token_account.owner == escrow_account.key() @ EscrowError::InvalidVaultOwner
    )]
    pub vault_token_account: Account<'info, TokenAccount>,
    pub escrow_account: Account<'info, CycleEscrowAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecuteRingSettlement<'info> {
    #[account(
        mut,
        has_one = initializer @ EscrowError::UnauthorizedAuthority,
        seeds = [b"escrow", escrow_account.deal_id.as_bytes()],
        bump = escrow_account.bump
    )]
    pub escrow_account: Account<'info, CycleEscrowAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub recipient_token_account: Account<'info, TokenAccount>,
    pub initializer: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum EscrowError {
    #[msg("Escrow is not locked.")]
    EscrowNotLocked,
    #[msg("Escrow has already been settled.")]
    AlreadySettled,
    #[msg("Deal ID exceeds maximum length of 32 characters.")]
    DealIdTooLong,
    #[msg("Vault token account owner must be the escrow PDA.")]
    InvalidVaultOwner,
    #[msg("Unauthorized settlement authority.")]
    UnauthorizedAuthority,
}