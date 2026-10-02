import heroImageUrl from './assets/hero.jpg'
import aboutImageUrl from './assets/about.jpg'
import fruitsImageUrl from './assets/products/fruits.jpg'
import vegetablesImageUrl from './assets/products/vegetables.jpg'
import grainsImageUrl from './assets/products/grains.jpg'
import spicesImageUrl from './assets/products/spices.jpg'
import tamarindImageUrl from './assets/products/tamarind.jpg'

export const siteConfig = {
  companyName: 'JARAMA GLOBAL TRADE (OPC) PRIVATE LIMITED',
  publicSiteDomain: '',
  officialEmail: 'Sales@jaramaglobaltrade.com',
  contactNumber: '6281253007',
  exporterCategory: 'Merchant Exporter',
  dateOfIncorporation: '15/07/2026',
  addressLine1: '3-10, Tekulapally, Vikarabad, Tekulapalli',
  city: 'K.V.Rangareddy',
  district: 'Vikarabad',
  state: 'TELANGANA',
  pincode: '501202',
  sourcingRegions: ['Maharashtra', 'Telangana', 'Andhra Pradesh', 'Karnataka'],
  enquiryEndpoint: '',
  heroImage: heroImageUrl,
  aboutImage: aboutImageUrl,
  aboutCopy:
    'Based in Vikarabad, Telangana, JARAMA GLOBAL TRADE (OPC) PRIVATE LIMITED sources spices, vegetables, fruits, and tamarind from across Maharashtra, Telangana, Andhra Pradesh, and Karnataka for markets around the world.',
  services: [
    {
      title: 'Export solutions',
      description:
        'Global export of spices, vegetables, and fruits, coordinated with care at every important step.',
    },
    {
      title: 'Import sourcing',
      description:
        'Supplier discovery and product sourcing support shaped around your requirements and destination.',
    },
    {
      title: 'Trade coordination',
      description:
        'Clear communication across suppliers, partners, and the details that keep a shipment moving.',
    },
  ],
  products: [
    {
      title: 'Fruits',
      description: 'Fresh fruit sourced for dependable quality and destination-market requirements.',
      image: fruitsImageUrl,
      imageAlt: 'A colorful assortment of fresh fruit',
    },
    {
      title: 'Vegetables',
      description: 'Carefully selected vegetables, coordinated from supplier to shipment.',
      image: vegetablesImageUrl,
      imageAlt: 'Fresh vegetables ready for market',
    },
    {
      title: 'Grains & Dals',
      description: 'A diverse range of grains and dals selected for quality, consistency, and dependable export readiness.',
      image: grainsImageUrl,
      imageAlt: 'A collection of grains, dals, and pulses arranged in bowls',
    },
    {
      title: 'Spices',
      description: 'Aromatic spices sourced with attention to quality and consistency.',
      image: spicesImageUrl,
      imageAlt: 'A colorful selection of whole spices',
    },
    {
      title: 'Tamarind',
      description: 'Tamarind pods for food, ingredient, and international trade markets.',
      image: tamarindImageUrl,
      imageAlt: 'Bagged tamarind pods with lemons',
      credit: {
        label: 'Leslie Seaton / Wikimedia Commons, CC BY 2.0',
        href: 'https://commons.wikimedia.org/wiki/File:Tamarind_Pods_(5201031112).jpg',
      },
    },
  ],
}