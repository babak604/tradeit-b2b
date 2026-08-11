export interface DemoCompanyOffer {
  id: string;
  company_name: string;
  location: string;
  category: 'Retail' | 'B2B Services' | 'Real Estate' | 'Tech & SaaS';
  title: string;
  offering_summary: string;
  looking_for_summary: string;
  estimated_value: number;
  video_url: string;
  is_verified: boolean;
}

export const DEMO_PRESET_OFFERS: DemoCompanyOffer[] = [
  {
    id: 'demo-retail-01',
    company_name: 'Easy Mondays Apparel',
    location: 'Montreal, QC',
    category: 'Retail',
    title: 'Surplus Premium Apparel Stock & Merch',
    offering_summary: '250 Units Premium Organic Cotton Hoodies & Overstock Wear',
    looking_for_summary: '4K Studio Video Production & Commercial Content Creation',
    estimated_value: 8500,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    is_verified: true,
  },
  {
    id: 'demo-creative-02',
    company_name: 'Montreal Creative Studios',
    location: 'Montreal, QC',
    category: 'B2B Services',
    title: 'Full 4K Video Production & Editing',
    offering_summary: '50 Hours Studio 4K Multi-cam Production & Post-Editing',
    looking_for_summary: 'Furnished Commercial Office or Co-working Space',
    estimated_value: 5000,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    is_verified: true,
  },
  {
    id: 'demo-realestate-03',
    company_name: 'St-Laurent Tech Hub',
    location: 'Montreal, QC',
    category: 'Real Estate',
    title: 'Downtown Dedicated Office Workspace',
    offering_summary: '200 Sq Ft Furnished Office Lease with Gigabit Fiber (6 Months)',
    looking_for_summary: 'Corporate Legal Retainer & IP Counsel',
    estimated_value: 5000,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    is_verified: true,
  },
  {
    id: 'demo-legal-04',
    company_name: 'Apex Legal Partners',
    location: 'Montreal, QC',
    category: 'B2B Services',
    title: 'Corporate Legal Retainer & IP Audit',
    offering_summary: '30 Hours Corporate Law, Trademarking & Contract Strategy',
    looking_for_summary: 'Retail Merchandise & Employee Apparel Packages',
    estimated_value: 5000,
    video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoylikes.mp4',
    is_verified: true,
  },
];