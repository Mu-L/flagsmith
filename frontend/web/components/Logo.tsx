import { FC } from 'react'

type LogoType = {
  size?: number
}

const Logo: FC<LogoType> = ({ size = 256 }) => {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 256 256'
      fill='none'
    >
      <clipPath id='a'>
        <path d='M28.909 29.606H227.09v196.789H28.909z' />
      </clipPath>
      <rect width='256' height='256' rx='30' />
      <g fill='#63f' clipPath='url(#a)'>
        <path d='M33.676 109.436c-9.537-32.045-4.774-62.698 35.729-74.3 10.271-2.942 25.928-5.067 36.556-5.234 38.798-.607 119.138-.126 120.973.019 1.009.081-2.873 15.47-9.678 25.647-11.129 16.642-26.981 24.454-47.009 25.47-24.663 1.252-49.395 1.485-74.096 1.497-24.458.012-45.442 7.376-61.562 26.587-.178.213-.602.218-.913.314M155.673 101.908l-65.427-.12c-33.925.296-61.337 28.075-61.337 62.303 0 34.229 27.412 62.007 61.337 62.304v-80.397h65.427z' />
      </g>
    </svg>
  )
}

export default Logo
