import { cn } from "@/lib/utils";
import Image from "next/image";
import * as React from "react";

export function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={25}
      height={24}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.58 2H10.58V4H8.58002V6H6.58002V8H4.58002V10H2.58002V12H4.58002V22H11.58V16H13.58V22H20.58V12H22.58V10H20.58V8H18.58V6H16.58V4H14.58V2ZM14.58 4V6H16.58V8H18.58V10H20.58V12H18.58V20H15.58V14H9.58002V20H6.58002V12H4.58002V10H6.58002V8H8.58002V6H10.58V4H14.58Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function LeaderboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={25}
      height={24}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12.5 1H14.5V9H22.5V13H20.5V11H12.5V5H10.5V3H12.5V1ZM8.5 7V5H10.5V7H8.5ZM6.5 9V7H8.5V9H6.5ZM4.5 11V9H6.5V11H4.5ZM14.5 19V21H12.5V23H10.5V15H2.5V11H4.5V13H12.5V19H14.5ZM16.5 17V19H14.5V17H16.5ZM18.5 15V17H16.5V15H18.5ZM18.5 15H20.5V13H18.5V15Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function ProfileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={25}
      height={24}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.41998 3H21.42V21H3.41998V3ZM19.42 19V5H5.41998V19H19.42ZM14.42 7H10.42V11H14.42V7ZM15.42 13H9.41998V15H7.41998V17H9.41998V15H15.42V17H17.42V15H15.42V13Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function WalletIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M2 6.19998H13.4C13.5591 6.19998 13.7117 6.26319 13.8243 6.37571C13.9368 6.48823 14 6.64085 14 6.79998V12.8C14 12.9591 13.9368 13.1117 13.8243 13.2242C13.7117 13.3368 13.5591 13.4 13.4 13.4H2.6C2.44087 13.4 2.28826 13.3368 2.17574 13.2242C2.06321 13.1117 2 12.9591 2 12.8V6.19998ZM2.6 2.59998H11.6V4.99998H2V3.19998C2 3.04085 2.06321 2.88823 2.17574 2.77571C2.28826 2.66319 2.44087 2.59998 2.6 2.59998ZM9.8 9.19998V10.4H11.6V9.19998H9.8Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function InviteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={21}
      height={21}
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.5 2.16663H10.5V3.83329H8.83331V8.83329H10.5V3.83329H15.5V2.16663ZM15.5 8.83329H10.5V10.5H15.5V8.83329ZM15.5 3.83329H17.1666V8.83329H15.5V3.83329ZM6.33331 13.8333H7.99998V12.1666H18V13.8333H7.99998V17.1666H18V13.8333H19.6666V18.8333H6.33331V13.8333ZM2.99998 7.16663H4.66665V8.83329H6.33331V10.5H4.66665V12.1666H2.99998V10.5H1.33331V8.83329H2.99998V7.16663Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function InviteFriendsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M13.5 1.5H9V3H7.5V7.5H9V3H13.5V1.5ZM13.5 7.5H9V9H13.5V7.5ZM13.5 3H15V7.5H13.5V3ZM5.25 12H6.75V10.5H15.75V12H6.75V15H15.75V12H17.25V16.5H5.25V12ZM2.25 6H3.75V7.5H5.25V9H3.75V10.5H2.25V9H0.75V7.5H2.25V6Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.25 3.75V2.25H9.75V3.75H11.25V5.25H12.75V6.75H11.25V5.25H9.75V12.75H8.25V5.25H6.75V6.75H5.25V5.25H6.75V3.75H8.25ZM2.25 11.25V15.75H15.75V11.25H14.25V14.25H3.75V11.25H2.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15 8.25V9.75H6V11.25H4.5V9.75H3V8.25H4.5V6.75H6V8.25H15ZM7.5 5.25H6V6.75H7.5V5.25ZM7.5 5.25H9V3.75H7.5V5.25ZM7.5 12.75H6V11.25H7.5V12.75ZM7.5 12.75H9V14.25H7.5V12.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

export const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M15 8.25V9.75H6V11.25H4.5V9.75H3V8.25H4.5V6.75H6V8.25H15ZM7.5 5.25H6V6.75H7.5V5.25ZM7.5 5.25H9V3.75H7.5V5.25ZM7.5 12.75H6V11.25H7.5V12.75ZM7.5 12.75H9V14.25H7.5V12.75Z"
      fill="white"
    />
  </svg>
);

export function GamePadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.33334 3.3335H14.6667V12.6668H1.33334V3.3335ZM13.3333 11.3335V4.66683H2.66668V11.3335H13.3333ZM5.33334 6.00016H6.66668V7.3335H8.00001V8.66683H6.66668V10.0002H5.33334V8.66683H4.00001V7.3335H5.33334V6.00016ZM9.33334 6.00016H10.6667V7.3335H9.33334V6.00016ZM12 8.66683H10.6667V10.0002H12V8.66683Z"
        fill="#FFC931"
      />
    </svg>
  );
}

export function WinsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4.00001 1.3335H10.6667V2.66683H4.00001V1.3335ZM2.66668 4.00016V2.66683H4.00001V4.00016H2.66668ZM2.66668 12.0002H1.33334V4.00016H2.66668V12.0002ZM4.00001 13.3335H2.66668V12.0002H4.00001V13.3335ZM12 13.3335H4.00001V14.6668H12V13.3335ZM13.3333 12.0002V13.3335H12V12.0002H13.3333ZM13.3333 12.0002H14.6667V5.3335H13.3333V12.0002ZM8.00001 4.00016H5.33334V5.3335H4.00001V10.6668H5.33334V12.0002H10.6667V10.6668H12V8.00016H10.6667V10.6668H5.33334V5.3335H8.00001V4.00016ZM9.33334 9.3335V6.66683H10.6667V5.3335H12V4.00016H14.6667V2.66683H13.3333V1.3335H12V4.00016H10.6667V5.3335H9.33334V6.66683H6.66668V9.3335H9.33334Z"
        fill="#FFC931"
      />
    </svg>
  );
}

export function WinningsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3.99999 1.3335H12V2.66683H3.99999V1.3335ZM2.66666 4.00016V2.66683H3.99999V4.00016H2.66666ZM2.66666 12.0002V4.00016H1.33333V12.0002H2.66666ZM3.99999 13.3335V12.0002H2.66666V13.3335H3.99999ZM12 13.3335V14.6668H3.99999V13.3335H12ZM13.3333 12.0002V13.3335H12V12.0002H13.3333ZM13.3333 4.00016H14.6667V12.0002H13.3333V4.00016ZM13.3333 4.00016V2.66683H12V4.00016H13.3333ZM7.33333 3.3335H8.66666V4.66683H10.6667V6.00016H6.66666V7.3335H10.6667V11.3335H8.66666V12.6668H7.33333V11.3335H5.33333V10.0002H9.33333V8.66683H5.33333V4.66683H7.33333V3.3335Z"
        fill="#FFC931"
      />
    </svg>
  );
}

export function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.00001 0.666504H9.33334V5.99984H14.6667V8.6665H13.3333V7.33317H8.00001V3.33317H6.66668V1.99984H8.00001V0.666504ZM5.33334 4.6665V3.33317H6.66668V4.6665H5.33334ZM4.00001 5.99984V4.6665H5.33334V5.99984H4.00001ZM2.66668 7.33317V5.99984H4.00001V7.33317H2.66668ZM9.33334 12.6665V13.9998H8.00001V15.3332H6.66668V9.99984H1.33334V7.33317H2.66668V8.6665H8.00001V12.6665H9.33334ZM10.6667 11.3332V12.6665H9.33334V11.3332H10.6667ZM12 9.99984V11.3332H10.6667V9.99984H12ZM12 9.99984H13.3333V8.6665H12V9.99984Z"
        fill="#FFC931"
      />
    </svg>
  );
}

export function WaffleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="13"
      viewBox="0 0 16 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M1.04242 2.73877H3.72203V11.3731H1.04242V2.73877Z"
        fill="#FFC931"
      />
      <path
        d="M13.1901 0.0595703H15.8697L15.8548 8.64922L13.1901 8.69388V0.0595703Z"
        fill="#FFC931"
      />
      <path
        d="M1.04242 11.3735V8.69385H6.40164V11.3735H1.04242Z"
        fill="#FFC931"
      />
      <path
        d="M10.5104 11.3735V8.69385H13.19V11.3735H10.5104Z"
        fill="#FFC931"
      />
      <path
        d="M3.72208 2.73918V0.0595703H15.8696V2.73918H3.72208Z"
        fill="#FFC931"
      />
      <path
        d="M9.66196 9.51262L10.4807 8.69385H12.2522V9.55728L9.66196 9.51262Z"
        fill="#FB72FF"
      />
      <path
        d="M2.88843 9.5275L3.72208 8.69385L6.32726 8.72362L5.56804 9.5275H2.88843Z"
        fill="#FB72FF"
      />
      <path
        d="M2.88843 3.72168H3.69231V8.69385L2.88843 9.49773V3.72168Z"
        fill="#00CFF2"
      />
      <path
        d="M15.8995 2.76894H15.8948L15.8846 8.64926V8.67847L15.8555 8.67898L13.2199 8.72313V11.4032H10.4808V9.5564L9.66138 9.54241L9.59133 9.54121L10.4685 8.66409H13.1604V2.76894H3.75195V8.66409H6.43156V11.4032H1.01279V2.7094H3.6924V0.0297852H15.8995V2.76894Z"
        stroke="#1E1E1E"
        strokeWidth="0.0595469"
      />
      <path
        d="M0.149292 3.63184H2.8289V12.2661H0.149292V3.63184Z"
        fill="#FFC931"
      />
      <path
        d="M12.2969 0.952637H14.9765V9.58694H12.2969V0.952637Z"
        fill="#FFC931"
      />
      <path
        d="M0.149292 12.2665V9.58691H5.50852V12.2665H0.149292Z"
        fill="#FFC931"
      />
      <path
        d="M9.61728 12.2665V9.58691H12.2969V12.2665H9.61728Z"
        fill="#FFC931"
      />
      <path
        d="M2.82895 3.63225V3.58759V2.73904V0.952637H14.9765V3.63225H2.82895Z"
        fill="#FFC931"
      />
      <path
        d="M5.57784 7.97606V7.09321H4.61276V6.34748H5.57784V5.35498H6.27972V6.34748H7.25027V7.09321H6.27972V7.97606H5.57784Z"
        fill="#FB72FF"
      />
      <path
        d="M11.2249 6.6694C11.2249 7.40936 10.625 8.0092 9.88509 8.0092C9.14513 8.0092 8.54529 7.40936 8.54529 6.6694C8.54529 5.92944 9.14513 5.32959 9.88509 5.32959C10.625 5.32959 11.2249 5.92944 11.2249 6.6694Z"
        fill="#00CFF2"
      />
      <path
        d="M14.9764 0.952536V3.63215V9.58684L15.8547 8.67875V0.0742188L14.9764 0.952536Z"
        fill="#00CFF2"
      />
      <path
        d="M12.2969 0.952774H14.9765L15.8548 0.074457L3.67749 0.0595703L2.82895 0.952774H12.2969Z"
        fill="#FB72FF"
      />
      <path
        d="M2.8289 2.73877H1.0425L0.149292 3.58731H2.8289V2.73877Z"
        fill="#FB72FF"
      />
      <path
        d="M13.1901 11.3589L12.4085 12.2522C12.3904 12.2727 12.3564 12.2599 12.3564 12.2325V9.64697H13.1901V11.3589Z"
        fill="#00CFF2"
      />
      <path
        d="M9.88512 5.29972C10.6417 5.29972 11.2547 5.9129 11.2547 6.6693C11.2547 7.42569 10.6417 8.03888 9.88512 8.03888C9.12873 8.03888 8.51554 7.42569 8.51554 6.6693C8.51554 5.9129 9.12873 5.29972 9.88512 5.29972ZM6.30936 5.32544V6.31794H7.27994V7.12322H6.30936V8.00607H5.54796V7.12322H4.58288V6.31794H5.54796V5.32544H6.30936ZM15.8845 8.69103L15.8761 8.6997L14.9978 9.60794L14.9889 9.61687H13.2197V11.3699L13.2123 11.3783L12.4308 12.2715C12.3947 12.3129 12.3265 12.2873 12.3265 12.2322V12.2965H9.58739V9.55732H12.267V3.66218H2.85858V9.55732H5.5382V12.2965H0.119425V3.61752H0.0746155L0.128714 3.56616L1.02192 2.71761L1.03052 2.70943H2.79904V0.940913L2.80723 0.932308L3.65577 0.0391039L3.66458 0.0297852L3.67738 0.0298142L15.8547 0.044701L15.8845 0.04473V8.69103Z"
        stroke="#1E1E1E"
        strokeWidth="0.0595469"
      />
      <path
        d="M6.36393 8.70556C6.38463 8.68931 6.41666 8.70369 6.41666 8.73156V11.37L6.40943 11.3783L5.61406 12.2992C5.57779 12.3415 5.50884 12.3153 5.50943 12.2599L5.53834 9.60201L5.53846 9.5904L5.54635 9.58206L6.35997 8.70923L6.36393 8.70556Z"
        fill="#00CFF2"
        stroke="#1E1E1E"
        strokeWidth="0.0595469"
      />
    </svg>
  );
}

export function LeaveGameIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14.5228 15.9831V14.531H13.0686V15.9831H14.5228Z"
        fill="#331A39"
      />
      <path
        d="M13.0685 15.9999V14.5479H11.6165V15.9999H13.0685Z"
        fill="#331A39"
      />
      <path
        d="M11.6166 15.9662V14.5142H10.1646V15.9662H11.6166Z"
        fill="#331A39"
      />
      <path
        d="M10.1645 15.9662V14.5142H8.7124V15.9662H10.1645Z"
        fill="#331A39"
      />
      <path
        d="M8.71232 15.9662V14.5142H7.26025V15.9662H8.71232Z"
        fill="#331A39"
      />
      <path
        d="M7.26031 15.9662V14.5142L5.81665 14.531V15.983L7.26031 15.9662Z"
        fill="#331A39"
      />
      <path
        d="M5.79142 15.9662V14.5142H4.33936V15.9662H5.79142Z"
        fill="#331A39"
      />
      <path
        d="M4.33927 15.9662V14.5142H2.88721V15.9662H4.33927Z"
        fill="#331A39"
      />
      <path d="M14.506 15.9662V14.5142H1.4353V15.9662H14.506Z" fill="#331A39" />
      <path
        d="M14.5396 14.5142H15.9916V13.0601H14.5396V14.5142Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 14.5311H14.5311V13.0769H13.0769V14.5311Z"
        fill="#EA7EBD"
      />
      <path
        d="M11.625 14.5079H13.0771V13.0537H11.625V14.5079Z"
        fill="#EA7EBD"
      />
      <path
        d="M10.1729 14.5079H11.6249V13.0537H10.1729V14.5079Z"
        fill="#EA7EBD"
      />
      <path
        d="M8.7207 14.5079H10.1728V13.0537H8.7207V14.5079Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 14.5079H8.72086V13.0537H7.2688V14.5079Z"
        fill="#EA7EBD"
      />
      <path
        d="M5.81665 14.5079H7.26871V13.0537H5.81665V14.5079Z"
        fill="#EA7EBD"
      />
      <path
        d="M4.3645 14.5079H5.81657V13.0537H4.3645V14.5079Z"
        fill="#EA7EBD"
      />
      <path
        d="M2.9126 14.5311H4.36466V13.0769H2.9126V14.5311Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 14.5311H2.91471V13.0769H1.46265V14.5311Z"
        fill="#EA7EBD"
      />
      <path d="M0 14.5311H1.45206V13.0769H0V14.5311Z" fill="#331A39" />
      <path d="M14.5396 13.06H15.9916V11.6079H14.5396V13.06Z" fill="#331A39" />
      <path
        d="M13.0769 13.0768H14.5311V11.6248H13.0769V13.0768Z"
        fill="#EA7EBD"
      />
      <path
        d="M10.1729 13.0539H11.6249V11.6018H10.1729V13.0539Z"
        fill="#EA7EBD"
      />
      <path
        d="M8.7207 13.0539H10.1728V11.6018H8.7207V13.0539Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 13.0539H8.72086V11.6018H7.2688V13.0539Z"
        fill="#EA7EBD"
      />
      <path
        d="M5.81665 13.0539H7.26871V11.6018H5.81665V13.0539Z"
        fill="#EA7EBD"
      />
      <path
        d="M4.3645 13.0539H5.81657V11.6018H4.3645V13.0539Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 13.0768H2.91471V11.6248H1.46265V13.0768Z"
        fill="#EA7EBD"
      />
      <path d="M0 13.0768H1.45206V11.6248H0V13.0768Z" fill="#331A39" />
      <path
        d="M14.5396 11.608H15.9916V10.1538H14.5396V11.608Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 11.6248H14.5311V10.1707H13.0769V11.6248Z"
        fill="#EA7EBD"
      />
      <path
        d="M11.625 11.6016H13.0771V10.1475H11.625V11.6016Z"
        fill="#EA7EBD"
      />
      <path
        d="M8.7207 11.6016H10.1728V10.1475H8.7207V11.6016Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 11.6016H8.72086V10.1475H7.2688V11.6016Z"
        fill="#EA7EBD"
      />
      <path
        d="M5.81665 11.6016H7.26871V10.1475H5.81665V11.6016Z"
        fill="#EA7EBD"
      />
      <path
        d="M2.91455 11.6248H4.36661V10.1707H2.91455V11.6248Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 11.6248H2.91471V10.1707H1.46265V11.6248Z"
        fill="#EA7EBD"
      />
      <path d="M0 11.6248H1.45206V10.1707H0V11.6248Z" fill="#331A39" />
      <path
        d="M14.5396 10.1537H15.9916V8.70166H14.5396V10.1537Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 10.1706H14.5311V8.71851H13.0769V10.1706Z"
        fill="#EA7EBD"
      />
      <path
        d="M11.625 10.1475H13.0771V8.69336H11.625V10.1475Z"
        fill="#EA7EBD"
      />
      <path
        d="M10.1729 10.1475H11.6249V8.69336H10.1729V10.1475Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 10.1475H8.72086V8.69336H7.2688V10.1475Z"
        fill="#EA7EBD"
      />
      <path
        d="M4.3645 10.1706H5.81657V8.71851H4.3645V10.1706Z"
        fill="#EA7EBD"
      />
      <path
        d="M2.91455 10.1706H4.36661V8.71851H2.91455V10.1706Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 10.1706H2.91471V8.71851H1.46265V10.1706Z"
        fill="#EA7EBD"
      />
      <path d="M0 10.1706H1.45206V8.71851H0V10.1706Z" fill="#331A39" />
      <path
        d="M14.5059 8.70172H15.9579V7.24756H14.5059V8.70172Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 8.71857H14.5311V7.2644H13.0769V8.71857Z"
        fill="#EA7EBD"
      />
      <path
        d="M11.625 8.69327H13.0771V7.24121H11.625V8.69327Z"
        fill="#EA7EBD"
      />
      <path
        d="M10.1729 8.69327H11.6249V7.24121H10.1729V8.69327Z"
        fill="#EA7EBD"
      />
      <path
        d="M8.7207 8.69327H10.1728V7.24121H8.7207V8.69327Z"
        fill="#EA7EBD"
      />
      <path
        d="M5.81665 8.71857H7.26871V7.2644H5.81665V8.71857Z"
        fill="#EA7EBD"
      />
      <path d="M4.3645 8.71857H5.81657V7.2644H4.3645V8.71857Z" fill="#EA7EBD" />
      <path
        d="M2.91455 8.71857H4.36661V7.2644H2.91455V8.71857Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 8.71857H2.91471V7.2644H1.46265V8.71857Z"
        fill="#EA7EBD"
      />
      <path d="M0 8.71857H1.45206V7.2644H0V8.71857Z" fill="#331A39" />
      <path
        d="M14.5059 7.24772H15.9579V5.79565H14.5059V7.24772Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 7.26432H14.5311V5.81226H13.0769V7.26432Z"
        fill="#EA7EBD"
      />
      <path
        d="M11.625 7.24127H13.0771V5.78711H11.625V7.24127Z"
        fill="#EA7EBD"
      />
      <path
        d="M10.1729 7.24127H11.6249V5.78711H10.1729V7.24127Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 7.24127H8.72086V5.78711H7.2688V7.24127Z"
        fill="#EA7EBD"
      />
      <path
        d="M4.3645 7.26432H5.81657V5.81226H4.3645V7.26432Z"
        fill="#EA7EBD"
      />
      <path
        d="M2.9147 7.26432H4.36676L4.36466 5.81226H2.9126L2.9147 7.26432Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 7.26432H2.91471V5.81226H1.46265V7.26432Z"
        fill="#EA7EBD"
      />
      <path d="M0 7.26432H1.45206V5.81226H0V7.26432Z" fill="#331A39" />
      <path
        d="M14.5059 5.79547H15.9579V4.34131H14.5059V5.79547Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 5.81232H14.5311V4.35815H13.0769V5.81232Z"
        fill="#EA7EBD"
      />
      <path
        d="M11.625 5.78702H13.0771V4.33496H11.625V5.78702Z"
        fill="#EA7EBD"
      />
      <path
        d="M8.7207 5.81232H10.1728V4.35815H8.7207V5.81232Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 5.81232H8.72086V4.35815H7.2688V5.81232Z"
        fill="#EA7EBD"
      />
      <path
        d="M5.83984 5.81232H7.29191V4.35815H5.83984V5.81232Z"
        fill="#EA7EBD"
      />
      <path
        d="M2.91455 5.81232H4.36661V4.35815H2.91455V5.81232Z"
        fill="#EA7EBD"
      />
      <path
        d="M1.46265 5.81232H2.91471V4.35815H1.46265V5.81232Z"
        fill="#EA7EBD"
      />
      <path d="M0 5.81232H1.45206V4.35815H0V5.81232Z" fill="#331A39" />
      <path
        d="M14.5059 4.34147H15.9579V2.8894H14.5059V4.34147Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 4.35831H14.5311V2.90625H13.0769V4.35831Z"
        fill="#EA7EBD"
      />
      <path
        d="M10.1729 4.35831H11.6249V2.90625H10.1729V4.35831Z"
        fill="#EA7EBD"
      />
      <path
        d="M8.7207 4.35831H10.1728V2.90625H8.7207V4.35831Z"
        fill="#EA7EBD"
      />
      <path
        d="M7.2688 4.35831H8.72086V2.90625H7.2688V4.35831Z"
        fill="#EA7EBD"
      />
      <path
        d="M5.81665 4.35831H7.26871V2.90625H5.81665V4.35831Z"
        fill="#EA7EBD"
      />
      <path
        d="M4.3645 4.35831H5.81657V2.90625H4.3645V4.35831Z"
        fill="#EA7EBD"
      />
      <path d="M11.625 13.0768H13.0771V11.6248H11.625V13.0768Z" fill="white" />
      <path d="M2.9126 13.0768H4.36466V11.6248H2.9126V13.0768Z" fill="white" />
      <path
        d="M10.1729 11.6248H11.6249V10.1707H10.1729V11.6248Z"
        fill="white"
      />
      <path
        d="M4.36475 11.6248H5.81681V10.1707H4.36475V11.6248Z"
        fill="white"
      />
      <path d="M8.72095 10.1706H10.173V8.71851H8.72095V10.1706Z" fill="white" />
      <path
        d="M5.81665 10.1706H7.26871V8.71851H5.81665V10.1706Z"
        fill="white"
      />
      <path d="M7.2688 8.71857H8.72086V7.2644H7.2688V8.71857Z" fill="white" />
      <path d="M8.72095 7.26456H10.173V5.8125H8.72095V7.26456Z" fill="white" />
      <path d="M5.81665 7.26456H7.26871V5.8125H5.81665V7.26456Z" fill="white" />
      <path
        d="M10.1729 5.81232H11.6249V4.35815H10.1729V5.81232Z"
        fill="white"
      />
      <path
        d="M4.36475 5.81232H5.81681V4.35815H4.36475V5.81232Z"
        fill="white"
      />
      <path d="M11.625 4.35831H13.0771V2.90625H11.625V4.35831Z" fill="white" />
      <path d="M2.9126 4.35831H4.36466V2.90625H2.9126V4.35831Z" fill="white" />
      <path
        d="M1.46265 4.35831H2.91471V2.90625H1.46265V4.35831Z"
        fill="#EA7EBD"
      />
      <path
        d="M0.00830078 4.35831H1.46036V2.90625H0.00830078V4.35831Z"
        fill="#331A39"
      />
      <path
        d="M14.5312 14.5142H15.9833V1.4519H14.5312V14.5142Z"
        fill="#331A39"
      />
      <path
        d="M13.0769 2.90607H14.5311V1.4519H13.0769V2.90607Z"
        fill="#EA7EBD"
      />
      <path d="M11.625 2.90607H13.0771V1.4519H11.625V2.90607Z" fill="#E97BBB" />
      <path
        d="M10.1729 2.90607H11.6249V1.4519H10.1729V2.90607Z"
        fill="#EA7EBD"
      />
      <path d="M8.7207 2.90607H10.1728V1.4519H8.7207V2.90607Z" fill="#EA7EBD" />
      <path d="M7.2688 2.90607H8.72086V1.4519H7.2688V2.90607Z" fill="#EA7EBD" />
      <path
        d="M5.81665 2.90607H7.26871V1.4519H5.81665V2.90607Z"
        fill="#EA7EBD"
      />
      <path d="M4.3645 2.90607H5.81657V1.4519H4.3645V2.90607Z" fill="#EA7EBD" />
      <path d="M2.9126 2.90607H4.36466V1.4519H2.9126V2.90607Z" fill="#EA7EBD" />
      <path
        d="M1.46265 2.90607H2.91471V1.4519H1.46265V2.90607Z"
        fill="#EA7EBD"
      />
      <path
        d="M0.00830078 2.90607H1.46036V1.4519H0.00830078V2.90607Z"
        fill="#331A39"
      />
      <path d="M13.0769 0V1.45206H14.5311V0H13.0769Z" fill="#331A39" />
      <path d="M11.625 0V1.45206H13.0771V0H11.625Z" fill="#331A39" />
      <path d="M10.1729 0V1.45206H11.6249V0H10.1729Z" fill="#331A39" />
      <path d="M8.7207 0V1.45206H10.1728V0H8.7207Z" fill="#331A39" />
      <path
        d="M7.26245 0.00634766V1.45841H8.71451V0.00634766H7.26245Z"
        fill="#331A39"
      />
      <path
        d="M5.81665 0V1.45206L7.26241 1.45837V0.00630392L5.81665 0Z"
        fill="#331A39"
      />
      <path
        d="M4.3645 0V1.45206L5.81026 1.45837V0.00630392L4.3645 0Z"
        fill="#331A39"
      />
      <path d="M2.9126 0V1.45206H4.36466V0H2.9126Z" fill="#331A39" />
      <path d="M1.46265 0V1.45206H14.5396V0H1.46265Z" fill="#331A39" />
    </svg>
  );
}

export function Clock({
  className = "",
  style,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("w-20 h-20", className)} style={style} {...props}>
      <Image
        src="/images/icons/clock.png"
        alt="Clock"
        fill
        style={{ objectFit: "contain" }}
        className="!relative w-full h-full"
        draggable={false}
        priority={false}
      />
    </span>
  );
}

export function ForwardMessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M14 5H12V9H6V11H4V17H6V15H12V19H14V17H16V15H18V13H20V11H18V9H16V7H14V5Z"
        fill="white"
      />
    </svg>
  );
}

export function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M22 2H2V16H4V4H20V16H12V18H10V20H8V16H2V18H6V22H10V20H12V18H22V2Z"
        fill="#1B8FF5"
      />
    </svg>
  );
}
