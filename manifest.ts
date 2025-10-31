import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DITTO',
    short_name: 'DITTO',
    description: '디토 프로젝트 디스크립션',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/APPIcon.png',
        sizes: '48x48',
        type: 'image/png',
      },
    ]
  }
}