/* eslint-disable react/display-name */

import { memo, ReactNode, SVGProps } from 'react'

type IconProps = {
  children?: ReactNode
} & SVGProps<SVGSVGElement>

type IconComponentProps = {
  name: IconName
} & Omit<IconProps, 'children'>

const SVG = ({ children, ...rest }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 24 24`} fill="none" {...rest}>
    {children}
  </svg>
)

const PlusIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path d="M13 11H20V13H13V20H11V13H4V11H11V4H13V11Z" fill="currentColor" />
  </SVG>
))

const PencilIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M22 8.41406L9.41211 21.0029L3 20.9639V14.5859L15.5859 2L22 8.41406ZM5 15.4141V18.9756L8.58789 18.9971L15.002 12.583L11.4512 8.96191L5 15.4141ZM12.8652 7.54785L16.416 11.1689L19.1719 8.41406L15.5859 4.82812L12.8652 7.54785Z"
      fill="currentColor"
    />
  </SVG>
))

const ClockIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM13 11H16V13H11V6H13V11Z"
      fill="currentColor"
    />
  </SVG>
))

const LightModeIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12ZM17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z"
      fill="currentColor"
    />
    <path d="M4 11.0005V13.0005H1V11.0005H4Z" fill="currentColor" />
    <path d="M23 11.0005V13.0005H20V11.0005H23Z" fill="currentColor" />
    <path d="M7.05394 5.63792L5.63972 7.05214L3.5184 4.93082L4.93262 3.5166L7.05394 5.63792Z" fill="currentColor" />
    <path d="M20.489 19.073L19.0748 20.4872L16.9535 18.3659L18.3677 16.9517L20.489 19.073Z" fill="currentColor" />
    <path d="M13.0034 4.00195L11.0034 4.00195L11.0034 1.00195L13.0034 1.00195L13.0034 4.00195Z" fill="currentColor" />
    <path d="M13.0034 23.002L11.0034 23.002L11.0034 20.002L13.0034 20.002L13.0034 23.002Z" fill="currentColor" />
    <path d="M18.3689 7.04857L16.9547 5.63435L19.076 3.51303L20.4902 4.92725L18.3689 7.04857Z" fill="currentColor" />
    <path d="M4.93386 20.4836L3.51964 19.0694L5.64096 16.9481L7.05518 18.3623L4.93386 20.4836Z" fill="currentColor" />
  </SVG>
))

const DarkModeIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M12 5V4L11.3994 5.79954L12 5ZM5 11.999L5.79963 11.3985L4 11.999H5ZM12 5V6C15.3137 6 18 8.68629 18 12H19H20C20 7.58172 16.4183 4 12 4V5ZM19 12H18C18 15.3137 15.3137 18 12 18V19V20C16.4183 20 20 16.4183 20 12H19ZM12 19V18C8.68629 18 6 15.3137 6 12H5H4C4 16.4183 7.58172 20 12 20V19ZM5 12H6V11.999H5H4V12H5ZM5 11.999L4.20037 12.5995C5.29306 14.0546 7.03575 15 9 15V14V13C7.69221 13 6.53131 12.3729 5.79963 11.3985L5 11.999ZM9 14V15C12.3137 15 15 12.3137 15 9H14H13C13 11.2091 11.2091 13 9 13V14ZM14 9H15C15 7.03634 14.0555 5.29334 12.6006 4.20046L12 5L11.3994 5.79954C12.3732 6.53108 13 7.69218 13 9H14Z"
      fill="currentColor"
    />
  </SVG>
))

const ManageIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M14 19H12V17H3V15H12V13H14V19ZM21 17H16V15H21V17ZM8 11H6V9H3V7H6V5H8V11ZM21 9H10V7H21V9Z"
      fill="currentColor"
    />
  </SVG>
))

const WarningIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M22 7.625V16.375L16.375 22H7.625L2 16.375V7.625L7.625 2H16.375L22 7.625ZM4 8.45312V15.5469L8.45312 20H15.5469L20 15.5469V8.45312L15.5469 4H8.45312L4 8.45312ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
      fill="currentColor"
    />
  </SVG>
))

const DisconnectIcon = memo<IconProps>(props => (
  <SVG {...props}>
    <path
      d="M17 3.33975C18.9064 4.44042 20.3964 6.13939 21.2388 8.17316C22.0812 10.2069 22.229 12.4619 21.6593 14.5882C21.0895 16.7145 19.8341 18.5934 18.0876 19.9335C16.3412 21.2736 14.2013 22 12 22C9.79866 22 7.65883 21.2736 5.91239 19.9335C4.16594 18.5934 2.91049 16.7145 2.34074 14.5882C1.77099 12.4619 1.91879 10.2069 2.7612 8.17317C3.60362 6.13939 5.09358 4.44042 7 3.33975L8 5.0718C6.47486 5.95233 5.2829 7.31151 4.60896 8.93853C3.93503 10.5656 3.81679 12.3695 4.27259 14.0706C4.72839 15.7716 5.73276 17.2748 7.12991 18.3468C8.52706 19.4189 10.2389 20 12 20C13.7611 20 15.4729 19.4189 16.8701 18.3468C18.2672 17.2748 19.2716 15.7716 19.7274 14.0706C20.1832 12.3695 20.065 10.5656 19.391 8.93853C18.7171 7.31151 17.5251 5.95233 16 5.0718L17 3.33975Z"
      fill="currentColor"
    />
    <rect x="11" y="12" width="10" height="2" transform="rotate(-90 11 12)" fill="currentColor" />
  </SVG>
))

// Icon name mapping
const iconMap = {
  plus: PlusIcon,
  pencil: PencilIcon,
  clock: ClockIcon,
  'light-mode': LightModeIcon,
  'dark-mode': DarkModeIcon,
  manage: ManageIcon,
  warning: WarningIcon,
  disconnect: DisconnectIcon
} as const

export type IconName = keyof typeof iconMap

export const Icon = memo<IconComponentProps>(({ name, ...props }) => {
  const IconComponent = iconMap[name]

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found. Available icons:`, Object.keys(iconMap))
    return null
  }

  return <IconComponent {...props} />
})
