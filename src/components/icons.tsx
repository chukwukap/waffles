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
        d="M3 8.25V9.75H12V11.25H13.5V9.75H15V8.25H13.5V6.75H12V8.25H3ZM10.5 5.25H12V6.75H10.5V5.25ZM10.5 5.25H9V3.75H10.5V5.25ZM10.5 12.75H12V11.25H10.5V12.75ZM10.5 12.75H9V14.25H10.5V12.75Z"
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
        src="/images/icons/clock.svg"
        alt="Clock"
        fill
        style={{ objectFit: "contain" }}
        className="relative! w-full h-full"
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

export function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M17.5 14.9998H5.83333V1.6665H12.5V3.33317H14.1667V4.99984H12.5V6.6665H14.1667V4.99984H15.8333V6.6665H17.5V14.9998ZM7.5 3.33317V13.3332H15.8333V8.33317H10.8333V3.33317H7.5ZM2.5 4.99984H4.16667V16.6665H14.1667V18.3332H2.5V4.99984Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TrophyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M10.75 13.7035V15.25H14.5V16.75H5.5V15.25H9.25V13.7035C7.80002 13.5207 6.46661 12.8149 5.5 11.7188C4.53339 10.6227 4.00002 9.21146 4 7.75V3.25H16V7.75C16 9.21146 15.4666 10.6227 14.5 11.7188C13.5334 12.8149 12.2 13.5207 10.75 13.7035ZM1.75 4.75H3.25V7.75H1.75V4.75ZM16.75 4.75H18.25V7.75H16.75V4.75Z"
        fill={props.color || "#34C759"}
      />
    </svg>
  );
}

export function UsdcIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g clipPath="url(#clip0_268_39833)">
        <path
          d="M7.87865 15.5198C12.0512 15.5198 15.4081 12.1629 15.4081 7.99035C15.4081 3.81778 12.0512 0.460938 7.87865 0.460938C3.70608 0.460938 0.349243 3.81778 0.349243 7.99035C0.349243 12.1629 3.70608 15.5198 7.87865 15.5198Z"
          fill="#2775CA"
        />
        <path
          d="M9.94932 9.1832C9.94932 8.08518 9.29051 7.70871 7.97288 7.55187C7.03172 7.42635 6.84348 7.1754 6.84348 6.73613C6.84348 6.29686 7.15723 6.01458 7.78465 6.01458C8.34934 6.01458 8.66309 6.20282 8.81993 6.67341C8.85132 6.76753 8.94544 6.83025 9.03956 6.83025H9.54146C9.66697 6.83025 9.76109 6.73613 9.76109 6.61069V6.57929C9.63558 5.88907 9.07088 5.35576 8.34934 5.29304V4.54009C8.34934 4.41458 8.25523 4.32046 8.09839 4.28906H7.62781C7.5023 4.28906 7.40818 4.38318 7.37678 4.54009V5.26164C6.43562 5.38716 5.8396 6.01458 5.8396 6.79893C5.8396 7.83422 6.46702 8.24202 7.78465 8.39893C8.66309 8.55577 8.94544 8.74401 8.94544 9.246C8.94544 9.74798 8.50618 10.0931 7.91016 10.0931C7.09443 10.0931 6.81209 9.74791 6.71797 9.27732C6.68665 9.15188 6.59253 9.08908 6.49841 9.08908H5.96504C5.8396 9.08908 5.74548 9.1832 5.74548 9.30872V9.34011C5.87092 10.1244 6.3729 10.6891 7.40818 10.846V11.5989C7.40818 11.7244 7.5023 11.8185 7.65913 11.8499H8.12971C8.25523 11.8499 8.34934 11.7558 8.38074 11.5989V10.846C9.32191 10.6891 9.94932 10.0303 9.94932 9.1832Z"
          fill="white"
        />
        <path
          d="M6.27942 12.4778C3.83236 11.5994 2.57743 8.86997 3.48729 6.45423C3.95787 5.13658 4.99317 4.13269 6.27942 3.6621C6.40493 3.59938 6.46765 3.50526 6.46765 3.34835V2.90916C6.46765 2.78364 6.40493 2.68953 6.27942 2.6582C6.24802 2.6582 6.1853 2.6582 6.1539 2.68953C3.17354 3.6307 1.54214 6.79938 2.48331 9.77975C3.04802 11.5366 4.39706 12.8856 6.1539 13.4503C6.27942 13.5131 6.40493 13.4503 6.43626 13.3248C6.46765 13.2935 6.46765 13.2621 6.46765 13.1994V12.7601C6.46765 12.666 6.37354 12.5406 6.27942 12.4778ZM9.60493 2.68953C9.47942 2.62681 9.3539 2.68953 9.32258 2.81504C9.29118 2.84644 9.29118 2.87776 9.29118 2.94056V3.37975C9.29118 3.50526 9.3853 3.6307 9.47942 3.6935C11.9265 4.57188 13.1814 7.30129 12.2715 9.71703C11.801 11.0347 10.7657 12.0386 9.47942 12.5092C9.3539 12.5719 9.29118 12.666 9.29118 12.8229V13.2621C9.29118 13.3876 9.3539 13.4817 9.47942 13.5131C9.51082 13.5131 9.57354 13.5131 9.60493 13.4817C12.5853 12.5406 14.2167 9.37188 13.2755 6.39151C12.7108 4.60328 11.3304 3.25423 9.60493 2.68953Z"
          fill="white"
        />
      </g>
      <defs>
        <clipPath id="clip0_268_39833">
          <rect width="16" height="16" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function SoundOnIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M8.25 1.5H6.75V3H5.25V4.5H3.75V6H0.75V12H3.75V13.5H5.25V15H6.75V16.5H8.25V1.5ZM5.25 13.5V12H3.75V10.5H2.25V7.5H3.75V6H5.25V4.5H6.75V13.5H5.25ZM9.75 7.5H11.25V10.5H9.75V7.5ZM15.75 3H14.25V1.5H9.75V3H14.25V4.5H15.75V13.5H14.25V15H9.75V16.5H14.25V15H15.75V13.5H17.25V4.5H15.75V3ZM14.25 6H12.75V4.5H9.75V6H12.75V12H9.75V13.5H12.75V12H14.25V6Z"
        fill="white"
      />
    </svg>
  );
}

export function SoundOffIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M9.75 1.5H8.25V3H6.75V4.5H5.25V6H2.25V12H5.25V13.5H6.75V15H8.25V16.5H9.75V1.5ZM6.75 13.5V12H5.25V10.5H3.75V7.5H5.25V6H6.75V4.5H8.25V13.5H6.75ZM14.25 8.41725H12.75V6.91725H11.25V8.41725H12.75V9.91725H11.25V11.4172H12.75V9.91725H14.25V11.4172H15.75V9.91725H14.25V8.41725ZM14.25 8.41725H15.75V6.91725H14.25V8.41725Z"
        fill="white"
      />
    </svg>
  );
}

export function TrendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M4 2H2V4H4V6H2V8H4V6H6V8H8V6H6V4H8V2H6V4H4V2ZM16 4V20H22V4H16ZM18 6H20V18H18V6ZM9 10V20H15V10H9ZM11 18V12H13V18H11ZM8 14V20H2V14H8ZM6 18V16H4V18H6Z"
        fill="#14B985"
      />
    </svg>
  );
}

export function FlashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M12 1H14V9H22V13H20V11H12V5H10V3H12V1ZM8 7V5H10V7H8ZM6 9V7H8V9H6ZM4 11V9H6V11H4ZM14 19V21H12V23H10V15H2V11H4V13H12V19H14ZM16 17V19H14V17H16ZM18 15V17H16V15H18ZM18 15H20V13H18V15Z"
        fill="#FFC931"
      />
    </svg>
  );
}

export function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M14 5H12V9H6V11H4V17H6V15H12V19H14V17H16V15H18V13H20V11H18V9H16V7H14V5Z"
        fill="white"
      />
    </svg>
  );
}

export function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M22 2H2V16H4V4H20V16H12V18H10V20H8V16H2V18H6V22H10V20H12V18H22V2Z"
        fill="#1B8FF5"
      />
    </svg>
  );
}

export function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="24" cy="24" r="24" fill="#5865F2" />
      <path
        d="M32.405 16C30.985 15.325 29.475 14.84 27.885 14.555C27.695 14.885 27.48 15.34 27.325 15.695C25.64 15.455 23.965 15.455 22.31 15.695C22.155 15.335 21.935 14.885 21.74 14.555C20.15 14.84 18.64 15.325 17.22 16C14.36 20.18 13.625 24.265 14.005 28.29C15.735 29.54 17.395 30.15 19.01 30.645C19.42 30.095 19.785 29.51 20.09 28.91C19.505 28.69 18.945 28.43 18.405 28.13C18.545 28.025 18.68 27.915 18.81 27.805C22.14 29.32 25.81 29.32 29.095 27.805C29.225 27.915 29.36 28.025 29.5 28.13C28.955 28.43 28.395 28.69 27.81 28.91C28.12 29.51 28.485 30.095 28.895 30.645C30.515 30.15 32.17 29.54 33.9 28.29C34.34 23.795 33.195 19.775 32.405 16ZM20.265 25.61C19.245 25.61 18.41 24.68 18.41 23.54C18.41 22.4 19.225 21.47 20.265 21.47C21.32 21.47 22.155 22.4 22.135 23.54C22.135 24.68 21.32 25.61 20.265 25.61ZM27.705 25.61C26.685 25.61 25.85 24.68 25.85 23.54C25.85 22.4 26.665 21.47 27.705 21.47C28.76 21.47 29.595 22.4 29.575 23.54C29.575 24.68 28.76 25.61 27.705 25.61Z"
        fill="white"
      />
    </svg>
  );
}

export function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="24" cy="24" r="24" fill="black" />
      <path
        d="M27.7217 21.5515L34.7042 13.44H33.05L26.9866 20.482L22.1441 13.44H16.5608L23.9066 24.1225L16.5608 32.64H18.215L24.6408 25.1912L29.7708 32.64H35.3541L27.7208 21.5515H27.7217ZM25.4566 24.1772L24.7141 23.116L18.8108 14.6799H21.3374L26.1083 21.4972L26.8508 22.5584L33.0508 31.4184H30.5241L25.4566 24.178V24.1772Z"
        fill="white"
      />
    </svg>
  );
}

export function FarcasterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="48" height="48" rx="24" fill="#855DCD" />
      <path
        d="M33.6 14.4H14.4V24H19.2V33.6H28.8V24H33.6V14.4ZM28.8 24V28.8H19.2V24H28.8Z"
        fill="white"
      />
      <path d="M19.2 19.2H24V24H19.2V19.2Z" fill="#855DCD" />
      <path d="M24 19.2H28.8V24H24V19.2Z" fill="#855DCD" />
    </svg>
  );
}

export function GroupIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="24" cy="24" r="24" fill="#C7A8E0" />
      <path
        d="M24.375 24.375C26.4461 24.375 28.125 22.6961 28.125 20.625C28.125 18.5539 26.4461 16.875 24.375 16.875C22.3039 16.875 20.625 18.5539 20.625 20.625C20.625 22.6961 22.3039 24.375 24.375 24.375Z"
        fill="#2C124E"
      />
      <path
        d="M17.8125 23.4375C19.3658 23.4375 20.625 22.1783 20.625 20.625C20.625 19.0717 19.3658 17.8125 17.8125 17.8125C16.2592 17.8125 15 19.0717 15 20.625C15 22.1783 16.2592 23.4375 17.8125 23.4375Z"
        fill="#2C124E"
        fillOpacity="0.5"
      />
      <path
        d="M30.9375 23.4375C32.4908 23.4375 33.75 22.1783 33.75 20.625C33.75 19.0717 32.4908 17.8125 30.9375 17.8125C29.3842 17.8125 28.125 19.0717 28.125 20.625C28.125 22.1783 29.3842 23.4375 30.9375 23.4375Z"
        fill="#2C124E"
        fillOpacity="0.5"
      />
      <path
        d="M24.375 26.25C20.625 26.25 16.875 28.125 16.875 30.9375V31.875H31.875V30.9375C31.875 28.125 28.125 26.25 24.375 26.25Z"
        fill="#2C124E"
      />
      <path
        d="M13.125 30.9375C13.125 29.2687 14.6437 27.9187 16.875 27.3375C17.2875 29.1562 18.9375 30.5063 20.9437 30.8438C20.1 32.5312 18.6375 33.75 16.875 33.75H13.125V30.9375Z"
        fill="#2C124E"
        fillOpacity="0.5"
      />
      <path
        d="M35.625 30.9375V33.75H31.875C30.1125 33.75 28.65 32.5312 27.8063 30.8438C29.8125 30.5063 31.4625 29.1562 31.875 27.3375C34.1063 27.9187 35.625 29.2687 35.625 30.9375Z"
        fill="#2C124E"
        fillOpacity="0.5"
      />
    </svg>
  );
}


export function CupIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M10.6667 2H4.00004V3.33333H1.33337V10H5.33337V3.33333H10.6667V10H14.6667V3.33333H12V2H10.6667ZM13.3334 4.66667V8.66667H12V4.66667H13.3334ZM4.00004 8.66667H2.66671V4.66667H4.00004V8.66667ZM12 10H4.00004V11.3333H12V10ZM7.33337 11.3333H8.66671V12.6667H10.6667V14H5.33337V12.6667H7.33337V11.3333Z" fill="#14B985" />
    </svg>
  );
}

export function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7.33333 0H3.33333V1.33333H2V5.33333H3.33333V6.66667H7.33333V5.33333H3.33333V1.33333H7.33333V0ZM7.33333 1.33333H8.66667V5.33333H7.33333V1.33333ZM0 9.33333H1.33333V12H9.33333V13.3333H0V9.33333ZM1.33333 9.33333H9.33333V8H1.33333V9.33333ZM10.6667 9.33333H9.33333V13.3333H10.6667V9.33333ZM10 0H12.6667V1.33333H10V0ZM12.6667 5.33333H10V6.66667H12.6667V5.33333ZM12.6667 1.33333H14V5.33333H12.6667V1.33333ZM16 9.33333H14.6667V12H12V13.3333H16V9.33333ZM12 8H14.6667V9.33333H12V8Z" fill="#B93814" />
    </svg>
  );
}

export function Cloud1(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="157" height="98" viewBox="0 0 157 98" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M156.93 70.3501V75.7601H151.52V70.3501H156.93Z" fill="#70ADE6" />
      <path d="M156.93 64.9399V70.3499H151.52V64.9399H156.93Z" fill="#93C4F2" />
      <path d="M156.93 59.53V64.94H151.52V59.53H156.93Z" fill="#93C4F2" />
      <path d="M156.93 54.1201V59.5301H151.52V54.1201H156.93Z" fill="#E1E8FA" />
      <path d="M156.93 48.71V54.12H151.52V48.71H156.93Z" fill="#E1E8FA" />
      <path d="M156.93 43.29V48.7101H151.52V43.29H156.93Z" fill="#FFFEFE" />
      <path d="M151.52 75.76V81.18H146.11V75.76H151.52Z" fill="#70ADE6" />
      <path d="M151.52 70.3501V75.7601H146.11V70.3501H151.52Z" fill="#70ADE6" />
      <path d="M151.52 64.9399V70.3499H146.11V64.9399H151.52Z" fill="#93C4F2" />
      <path d="M151.52 59.53V64.94H146.11V59.53H151.52Z" fill="#E1E8FA" />
      <path d="M151.52 54.1201V59.5301H146.11V54.1201H151.52Z" fill="#E1E8FA" />
      <path d="M151.52 48.71V54.12H146.11V48.71H151.52Z" fill="#E1E8FA" />
      <path d="M151.52 43.29V48.7101H146.11V43.29H151.52Z" fill="#FFFEFE" />
      <path d="M151.52 37.8901V43.2901H146.11V37.8901H151.52Z" fill="#FFFEFE" />
      <path d="M146.11 75.76V81.18H140.7V75.76H146.11Z" fill="#70ADE6" />
      <path d="M146.11 70.3501V75.7601H140.7V70.3501H146.11Z" fill="#93C4F2" />
      <path d="M146.11 64.9399V70.3499H140.7V64.9399H146.11Z" fill="#E1E8FA" />
      <path d="M146.11 59.53V64.94H140.7V59.53H146.11Z" fill="#E1E8FA" />
      <path d="M146.11 54.1201V59.5301H140.7V54.1201H146.11Z" fill="#E1E8FA" />
      <path d="M146.11 48.71V54.12H140.7V48.71H146.11Z" fill="#E1E8FA" />
      <path d="M146.11 43.29V48.7101H140.7V43.29H146.11Z" fill="#E1E8FA" />
      <path d="M146.11 37.8901V43.2901H140.7V37.8901H146.11Z" fill="#FFFEFE" />
      <path d="M146.11 32.47V37.89H140.7V32.47H146.11Z" fill="#FFFEFE" />
      <path d="M140.7 81.1799V86.5899H135.29V81.1799H140.7Z" fill="#70ADE6" />
      <path d="M140.7 75.76V81.18H135.29V75.76H140.7Z" fill="#70ADE6" />
      <path d="M140.7 70.3501V75.7601H135.29V70.3501H140.7Z" fill="#93C4F2" />
      <path d="M140.7 64.9399V70.3499H135.29V64.9399H140.7Z" fill="#E1E8FA" />
      <path d="M140.7 59.53V64.94H135.29V59.53H140.7Z" fill="#E1E8FA" />
      <path d="M140.7 54.1201V59.5301H135.29V54.1201H140.7Z" fill="#E1E8FA" />
      <path d="M140.7 48.71V54.12H135.29V48.71H140.7Z" fill="#E1E8FA" />
      <path d="M140.7 43.29V48.7101H135.29V43.29H140.7Z" fill="#E1E8FA" />
      <path d="M140.7 37.8901V43.2901H135.29V37.8901H140.7Z" fill="#FFFEFE" />
      <path d="M140.7 32.47V37.89H135.29V32.47H140.7Z" fill="#FFFEFE" />
      <path d="M135.29 81.1799V86.5899H129.88V81.1799H135.29Z" fill="#70ADE6" />
      <path d="M135.29 75.76V81.18H129.88V75.76H135.29Z" fill="#93C4F2" />
      <path d="M135.29 70.3501V75.7601H129.88V70.3501H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 64.9399V70.3499H129.88V64.9399H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 59.53V64.94H129.88V59.53H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 54.1201V59.5301H129.88V54.1201H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 48.71V54.12H129.88V48.71H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 43.29V48.7101H129.88V43.29H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 37.8901V43.2901H129.88V37.8901H135.29Z" fill="#E1E8FA" />
      <path d="M135.29 32.47V37.89H129.88V32.47H135.29Z" fill="#FFFEFE" />
      <path d="M129.88 81.1799V86.5899H124.47V81.1799H129.88Z" fill="#70ADE6" />
      <path d="M129.88 75.76V81.18H124.47V75.76H129.88Z" fill="#93C4F2" />
      <path d="M129.88 70.3501V75.7601H124.47V70.3501H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 64.9399V70.3499H124.47V64.9399H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 59.53V64.94H124.47V59.53H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 54.1201V59.5301H124.47V54.1201H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 48.71V54.12H124.47V48.71H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 43.29V48.7101H124.47V43.29H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 37.8901V43.2901H124.47V37.8901H129.88Z" fill="#E1E8FA" />
      <path d="M129.88 32.47V37.89H124.47V32.47H129.88Z" fill="#FFFEFE" />
      <path d="M124.47 81.1799V86.5899H119.05V81.1799H124.47Z" fill="#70ADE6" />
      <path d="M124.47 75.76V81.18H119.05V75.76H124.47Z" fill="#93C4F2" />
      <path d="M124.47 70.3501V75.7601H119.05V70.3501H124.47Z" fill="#E1E8FA" />
      <path d="M124.47 64.9399V70.3499H119.05V64.9399H124.47Z" fill="#E1E8FA" />
      <path d="M124.47 59.53V64.94H119.05V59.53H124.47Z" fill="#E1E8FA" />
      <path d="M124.47 54.1201V59.5301H119.05V54.1201H124.47Z" fill="#E1E8FA" />
      <path d="M124.47 48.71V54.12H119.05V48.71H124.47Z" fill="#E1E8FA" />
      <path d="M124.47 43.29V48.7101H119.05V43.29H124.47Z" fill="#E1E8FA" />
      <path d="M124.47 37.8901V43.2901H119.05V37.8901H124.47Z" fill="#FFFEFE" />
      <path d="M124.47 32.47V37.89H119.05V32.47H124.47Z" fill="#FFFEFE" />
      <path d="M119.05 81.1799V86.5899H113.64V81.1799H119.05Z" fill="#70ADE6" />
      <path d="M119.05 75.76V81.18H113.64V75.76H119.05Z" fill="#93C4F2" />
      <path d="M119.05 70.3501V75.7601H113.64V70.3501H119.05Z" fill="#E1E8FA" />
      <path d="M119.05 64.9399V70.3499H113.64V64.9399H119.05Z" fill="#E1E8FA" />
      <path d="M119.05 59.53V64.94H113.64V59.53H119.05Z" fill="#E1E8FA" />
      <path d="M119.05 54.1201V59.5301H113.64V54.1201H119.05Z" fill="#E1E8FA" />
      <path d="M119.05 48.71V54.12H113.64V48.71H119.05Z" fill="#E1E8FA" />
      <path d="M119.05 43.29V48.7101H113.64V43.29H119.05Z" fill="#FFFEFE" />
      <path d="M119.05 37.8901V43.2901H113.64V37.8901H119.05Z" fill="#FFFEFE" />
      <path d="M119.05 32.47V37.89H113.64V32.47H119.05Z" fill="#FFFEFE" />
      <path d="M113.64 81.1799V86.5899H108.23V81.1799H113.64Z" fill="#70ADE6" />
      <path d="M113.64 75.76V81.18H108.23V75.76H113.64Z" fill="#70ADE6" />
      <path d="M113.64 70.3501V75.7601H108.23V70.3501H113.64Z" fill="#93C4F2" />
      <path d="M113.64 64.9399V70.3499H108.23V64.9399H113.64Z" fill="#93C4F2" />
      <path d="M113.64 59.53V64.94H108.23V59.53H113.64Z" fill="#E1E8FA" />
      <path d="M113.64 54.1201V59.5301H108.23V54.1201H113.64Z" fill="#FFFEFE" />
      <path d="M113.64 48.71V54.12H108.23V48.71H113.64Z" fill="#FFFEFE" />
      <path d="M113.64 43.29V48.7101H108.23V43.29H113.64Z" fill="#FFFEFE" />
      <path d="M113.64 37.8901V43.2901H108.23V37.8901H113.64Z" fill="#FFFEFE" />
      <path d="M108.23 81.1799V86.5899H102.82V81.1799H108.23Z" fill="#70ADE6" />
      <path d="M108.23 75.76V81.18H102.82V75.76H108.23Z" fill="#70ADE6" />
      <path d="M108.23 70.3501V75.7601H102.82V70.3501H108.23Z" fill="#93C4F2" />
      <path d="M108.23 64.9399V70.3499H102.82V64.9399H108.23Z" fill="#93C4F2" />
      <path d="M108.23 59.53V64.94H102.82V59.53H108.23Z" fill="#E1E8FA" />
      <path d="M108.23 54.1201V59.5301H102.82V54.1201H108.23Z" fill="#FFFEFE" />
      <path d="M108.23 48.71V54.12H102.82V48.71H108.23Z" fill="#FFFEFE" />
      <path d="M108.23 43.29V48.7101H102.82V43.29H108.23Z" fill="#FFFEFE" />
      <path d="M102.82 86.5901V92.0001H97.4102V86.5901H102.82Z" fill="#70ADE6" />
      <path d="M102.82 81.1799V86.5899H97.4102V81.1799H102.82Z" fill="#70ADE6" />
      <path d="M102.82 75.76V81.18H97.4102V75.76H102.82Z" fill="#93C4F2" />
      <path d="M102.82 70.3501V75.7601H97.4102V70.3501H102.82Z" fill="#E1E8FA" />
      <path d="M102.82 64.9399V70.3499H97.4102V64.9399H102.82Z" fill="#E1E8FA" />
      <path d="M102.82 59.53V64.94H97.4102V59.53H102.82Z" fill="#E1E8FA" />
      <path d="M102.82 54.1201V59.5301H97.4102V54.1201H102.82Z" fill="#E1E8FA" />
      <path d="M102.82 48.71V54.12H97.4102V48.71H102.82Z" fill="#FFFEFE" />
      <path d="M102.82 43.29V48.7101H97.4102V43.29H102.82Z" fill="#FFFEFE" />
      <path d="M102.82 37.8901V43.2901H97.4102V37.8901H102.82Z" fill="#70ADE6" />
      <path d="M102.82 32.47V37.89H97.4102V32.47H102.82Z" fill="#93C4F2" />
      <path d="M102.82 27.0601V32.47H97.4102V27.0601H102.82Z" fill="#E1E8FA" />
      <path d="M102.82 21.6499V27.0599H97.4102V21.6499H102.82Z" fill="#E1E8FA" />
      <path d="M97.4102 86.5901V92.0001H91.9902V86.5901H97.4102Z" fill="#70ADE6" />
      <path d="M97.4102 81.1799V86.5899H91.9902V81.1799H97.4102Z" fill="#93C4F2" />
      <path d="M97.4102 75.76V81.18H91.9902V75.76H97.4102Z" fill="#93C4F2" />
      <path d="M97.4102 70.3501V75.7601H91.9902V70.3501H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 64.9399V70.3499H91.9902V64.9399H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 59.53V64.94H91.9902V59.53H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 54.1201V59.5301H91.9902V54.1201H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 48.71V54.12H91.9902V48.71H97.4102Z" fill="#FFFEFE" />
      <path d="M97.4102 43.29V48.7101H91.9902V43.29H97.4102Z" fill="#FFFEFE" />
      <path d="M97.4102 37.8901V43.2901H91.9902V37.8901H97.4102Z" fill="#FFFEFE" />
      <path d="M97.4102 32.47V37.89H91.9902V32.47H97.4102Z" fill="#93C4F2" />
      <path d="M97.4102 27.0601V32.47H91.9902V27.0601H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 21.6499V27.0599H91.9902V21.6499H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 16.24V21.65H91.9902V16.24H97.4102Z" fill="#E1E8FA" />
      <path d="M97.4102 10.8301V16.2401H91.9902V10.8301H97.4102Z" fill="#E1E8FA" />
      <path d="M91.9901 92V97.41H86.5801V92H91.9901Z" fill="#70ADE6" />
      <path d="M91.9901 86.5901V92.0001H86.5801V86.5901H91.9901Z" fill="#70ADE6" />
      <path d="M91.9901 81.1799V86.5899H86.5801V81.1799H91.9901Z" fill="#93C4F2" />
      <path d="M91.9901 75.76V81.18H86.5801V75.76H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 70.3501V75.7601H86.5801V70.3501H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 64.9399V70.3499H86.5801V64.9399H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 59.53V64.94H86.5801V59.53H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 54.1201V59.5301H86.5801V54.1201H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 48.71V54.12H86.5801V48.71H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 43.29V48.7101H86.5801V43.29H91.9901Z" fill="#FFFEFE" />
      <path d="M91.9901 37.8901V43.2901H86.5801V37.8901H91.9901Z" fill="#FFFEFE" />
      <path d="M91.9901 32.47V37.89H86.5801V32.47H91.9901Z" fill="#93C4F2" />
      <path d="M91.9901 27.0601V32.47H86.5801V27.0601H91.9901Z" fill="#93C4F2" />
      <path d="M91.9901 21.6499V27.0599H86.5801V21.6499H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 16.24V21.65H86.5801V16.24H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 10.8301V16.2401H86.5801V10.8301H91.9901Z" fill="#E1E8FA" />
      <path d="M91.9901 5.40991V10.8299H86.5801V5.40991H91.9901Z" fill="#E1E8FA" />
      <path d="M86.5799 92V97.41H81.1699V92H86.5799Z" fill="#70ADE6" />
      <path d="M86.5799 86.5901V92.0001H81.1699V86.5901H86.5799Z" fill="#93C4F2" />
      <path d="M86.5799 81.1799V86.5899H81.1699V81.1799H86.5799Z" fill="#93C4F2" />
      <path d="M86.5799 75.76V81.18H81.1699V75.76H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 70.3501V75.7601H81.1699V70.3501H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 64.9399V70.3499H81.1699V64.9399H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 59.53V64.94H81.1699V59.53H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 54.1201V59.5301H81.1699V54.1201H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 48.71V54.12H81.1699V48.71H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 43.29V48.7101H81.1699V43.29H86.5799Z" fill="#FFFEFE" />
      <path d="M86.5799 37.8901V43.2901H81.1699V37.8901H86.5799Z" fill="#FFFEFE" />
      <path d="M86.5799 32.47V37.89H81.1699V32.47H86.5799Z" fill="#93C4F2" />
      <path d="M86.5799 27.0601V32.47H81.1699V27.0601H86.5799Z" fill="#93C4F2" />
      <path d="M86.5799 21.6499V27.0599H81.1699V21.6499H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 16.24V21.65H81.1699V16.24H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 10.8301V16.2401H81.1699V10.8301H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 5.40991V10.8299H81.1699V5.40991H86.5799Z" fill="#E1E8FA" />
      <path d="M86.5799 0V5.41H81.1699V0H86.5799Z" fill="#FFFEFE" />
      <path d="M81.1698 92V97.41H75.7598V92H81.1698Z" fill="#70ADE6" />
      <path d="M81.1698 86.5901V92.0001H75.7598V86.5901H81.1698Z" fill="#93C4F2" />
      <path d="M81.1698 81.1799V86.5899H75.7598V81.1799H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 75.76V81.18H75.7598V75.76H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 70.3501V75.7601H75.7598V70.3501H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 64.9399V70.3499H75.7598V64.9399H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 59.53V64.94H75.7598V59.53H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 54.1201V59.5301H75.7598V54.1201H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 48.71V54.12H75.7598V48.71H81.1698Z" fill="#FFFEFE" />
      <path d="M81.1698 43.29V48.7101H75.7598V43.29H81.1698Z" fill="#FFFEFE" />
      <path d="M81.1698 37.8901V43.2901H75.7598V37.8901H81.1698Z" fill="#FFFEFE" />
      <path d="M81.1698 32.47V37.89H75.7598V32.47H81.1698Z" fill="#93C4F2" />
      <path d="M81.1698 27.0601V32.47H75.7598V27.0601H81.1698Z" fill="#93C4F2" />
      <path d="M81.1698 21.6499V27.0599H75.7598V21.6499H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 16.24V21.65H75.7598V16.24H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 10.8301V16.2401H75.7598V10.8301H81.1698Z" fill="#E1E8FA" />
      <path d="M81.1698 5.40991V10.8299H75.7598V5.40991H81.1698Z" fill="#FFFEFE" />
      <path d="M81.1698 0V5.41H75.7598V0H81.1698Z" fill="#FFFEFE" />
      <path d="M75.7596 92V97.41H70.3496V92H75.7596Z" fill="#70ADE6" />
      <path d="M75.7596 86.5901V92.0001H70.3496V86.5901H75.7596Z" fill="#93C4F2" />
      <path d="M75.7596 81.1799V86.5899H70.3496V81.1799H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 75.76V81.18H70.3496V75.76H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 70.3501V75.7601H70.3496V70.3501H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 64.9399V70.3499H70.3496V64.9399H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 59.53V64.94H70.3496V59.53H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 54.1201V59.5301H70.3496V54.1201H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 48.71V54.12H70.3496V48.71H75.7596Z" fill="#FFFEFE" />
      <path d="M75.7596 43.29V48.7101H70.3496V43.29H75.7596Z" fill="#FFFEFE" />
      <path d="M75.7596 37.8901V43.2901H70.3496V37.8901H75.7596Z" fill="#FFFEFE" />
      <path d="M75.7596 32.47V37.89H70.3496V32.47H75.7596Z" fill="#93C4F2" />
      <path d="M75.7596 27.0601V32.47H70.3496V27.0601H75.7596Z" fill="#93C4F2" />
      <path d="M75.7596 21.6499V27.0599H70.3496V21.6499H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 16.24V21.65H70.3496V16.24H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 10.8301V16.2401H70.3496V10.8301H75.7596Z" fill="#E1E8FA" />
      <path d="M75.7596 5.40991V10.8299H70.3496V5.40991H75.7596Z" fill="#FFFEFE" />
      <path d="M75.7596 0V5.41H70.3496V0H75.7596Z" fill="#FFFEFE" />
      <path d="M70.3504 92V97.41H64.9404V92H70.3504Z" fill="#70ADE6" />
      <path d="M70.3504 86.5901V92.0001H64.9404V86.5901H70.3504Z" fill="#93C4F2" />
      <path d="M70.3504 81.1799V86.5899H64.9404V81.1799H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 75.76V81.18H64.9404V75.76H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 70.3501V75.7601H64.9404V70.3501H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 64.9399V70.3499H64.9404V64.9399H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 59.53V64.94H64.9404V59.53H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 54.1201V59.5301H64.9404V54.1201H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 48.71V54.12H64.9404V48.71H70.3504Z" fill="#FFFEFE" />
      <path d="M70.3504 43.29V48.7101H64.9404V43.29H70.3504Z" fill="#FFFEFE" />
      <path d="M70.3504 37.8901V43.2901H64.9404V37.8901H70.3504Z" fill="#FFFEFE" />
      <path d="M70.3504 32.47V37.89H64.9404V32.47H70.3504Z" fill="#93C4F2" />
      <path d="M70.3504 27.0601V32.47H64.9404V27.0601H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 21.6499V27.0599H64.9404V21.6499H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 16.24V21.65H64.9404V16.24H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 10.8301V16.2401H64.9404V10.8301H70.3504Z" fill="#E1E8FA" />
      <path d="M70.3504 5.40991V10.8299H64.9404V5.40991H70.3504Z" fill="#FFFEFE" />
      <path d="M70.3504 0V5.41H64.9404V0H70.3504Z" fill="#FFFEFE" />
      <path d="M64.9403 92V97.41H59.5303V92H64.9403Z" fill="#70ADE6" />
      <path d="M64.9403 86.5901V92.0001H59.5303V86.5901H64.9403Z" fill="#93C4F2" />
      <path d="M64.9403 81.1799V86.5899H59.5303V81.1799H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 75.76V81.18H59.5303V75.76H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 70.3501V75.7601H59.5303V70.3501H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 64.9399V70.3499H59.5303V64.9399H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 59.53V64.94H59.5303V59.53H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 54.1201V59.5301H59.5303V54.1201H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 48.71V54.12H59.5303V48.71H64.9403Z" fill="#FFFEFE" />
      <path d="M64.9403 43.29V48.7101H59.5303V43.29H64.9403Z" fill="#FFFEFE" />
      <path d="M64.9403 37.8901V43.2901H59.5303V37.8901H64.9403Z" fill="#93C4F2" />
      <path d="M64.9403 32.47V37.89H59.5303V32.47H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 27.0601V32.47H59.5303V27.0601H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 21.6499V27.0599H59.5303V21.6499H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 16.24V21.65H59.5303V16.24H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 10.8301V16.2401H59.5303V10.8301H64.9403Z" fill="#E1E8FA" />
      <path d="M64.9403 5.40991V10.8299H59.5303V5.40991H64.9403Z" fill="#FFFEFE" />
      <path d="M64.9403 0V5.41H59.5303V0H64.9403Z" fill="#FFFEFE" />
      <path d="M59.5304 92V97.41H54.1104V92H59.5304Z" fill="#70ADE6" />
      <path d="M59.5304 86.5901V92.0001H54.1104V86.5901H59.5304Z" fill="#70ADE6" />
      <path d="M59.5304 81.1799V86.5899H54.1104V81.1799H59.5304Z" fill="#93C4F2" />
      <path d="M59.5304 75.76V81.18H54.1104V75.76H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 70.3501V75.7601H54.1104V70.3501H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 64.9399V70.3499H54.1104V64.9399H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 59.53V64.94H54.1104V59.53H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 54.1201V59.5301H54.1104V54.1201H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 48.71V54.12H54.1104V48.71H59.5304Z" fill="#FFFEFE" />
      <path d="M59.5304 43.29V48.7101H54.1104V43.29H59.5304Z" fill="#FFFEFE" />
      <path d="M59.5304 37.8901V43.2901H54.1104V37.8901H59.5304Z" fill="#93C4F2" />
      <path d="M59.5304 32.47V37.89H54.1104V32.47H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 27.0601V32.47H54.1104V27.0601H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 21.6499V27.0599H54.1104V21.6499H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 16.24V21.65H54.1104V16.24H59.5304Z" fill="#E1E8FA" />
      <path d="M59.5304 10.8301V16.2401H54.1104V10.8301H59.5304Z" fill="#FFFEFE" />
      <path d="M59.5304 5.40991V10.8299H54.1104V5.40991H59.5304Z" fill="#FFFEFE" />
      <path d="M59.5304 0V5.41H54.1104V0H59.5304Z" fill="#FFFEFE" />
      <path d="M54.1102 86.5901V92.0001H48.7002V86.5901H54.1102Z" fill="#70ADE6" />
      <path d="M54.1102 81.1799V86.5899H48.7002V81.1799H54.1102Z" fill="#70ADE6" />
      <path d="M54.1102 75.76V81.18H48.7002V75.76H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 70.3501V75.7601H48.7002V70.3501H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 64.9399V70.3499H48.7002V64.9399H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 59.53V64.94H48.7002V59.53H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 54.1201V59.5301H48.7002V54.1201H54.1102Z" fill="#FFFEFE" />
      <path d="M54.1102 48.71V54.12H48.7002V48.71H54.1102Z" fill="#FFFEFE" />
      <path d="M54.1102 43.29V48.7101H48.7002V43.29H54.1102Z" fill="#FFFEFE" />
      <path d="M54.1102 37.8901V43.2901H48.7002V37.8901H54.1102Z" fill="#93C4F2" />
      <path d="M54.1102 32.47V37.89H48.7002V32.47H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 27.0601V32.47H48.7002V27.0601H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 21.6499V27.0599H48.7002V21.6499H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 16.24V21.65H48.7002V16.24H54.1102Z" fill="#E1E8FA" />
      <path d="M54.1102 10.8301V16.2401H48.7002V10.8301H54.1102Z" fill="#FFFEFE" />
      <path d="M54.1102 5.40991V10.8299H48.7002V5.40991H54.1102Z" fill="#FFFEFE" />
      <path d="M54.1102 0V5.41H48.7002V0H54.1102Z" fill="#FFFEFE" />
      <path d="M48.7 86.5901V92.0001H43.29V86.5901H48.7Z" fill="#70ADE6" />
      <path d="M48.7 81.1799V86.5899H43.29V81.1799H48.7Z" fill="#70ADE6" />
      <path d="M48.7 75.76V81.18H43.29V75.76H48.7Z" fill="#70ADE6" />
      <path d="M48.7 70.3501V75.7601H43.29V70.3501H48.7Z" fill="#93C4F2" />
      <path d="M48.7 64.9399V70.3499H43.29V64.9399H48.7Z" fill="#E1E8FA" />
      <path d="M48.7 59.53V64.94H43.29V59.53H48.7Z" fill="#FFFEFE" />
      <path d="M48.7 54.1201V59.5301H43.29V54.1201H48.7Z" fill="#FFFEFE" />
      <path d="M48.7 48.71V54.12H43.29V48.71H48.7Z" fill="#FFFEFE" />
      <path d="M48.7 43.29V48.7101H43.29V43.29H48.7Z" fill="#93C4F2" />
      <path d="M48.7 37.8901V43.2901H43.29V37.8901H48.7Z" fill="#E1E8FA" />
      <path d="M48.7 32.47V37.89H43.29V32.47H48.7Z" fill="#E1E8FA" />
      <path d="M48.7 27.0601V32.47H43.29V27.0601H48.7Z" fill="#E1E8FA" />
      <path d="M48.7 21.6499V27.0599H43.29V21.6499H48.7Z" fill="#E1E8FA" />
      <path d="M48.7 16.24V21.65H43.29V16.24H48.7Z" fill="#FFFEFE" />
      <path d="M48.7 10.8301V16.2401H43.29V10.8301H48.7Z" fill="#FFFEFE" />
      <path d="M48.7 5.40991V10.8299H43.29V5.40991H48.7Z" fill="#FFFEFE" />
      <path d="M48.7 0V5.41H43.29V0H48.7Z" fill="#FFFEFE" />
      <path d="M43.2899 86.5901V92.0001H37.8799V86.5901H43.2899Z" fill="#70ADE6" />
      <path d="M43.2899 81.1799V86.5899H37.8799V81.1799H43.2899Z" fill="#70ADE6" />
      <path d="M43.2899 75.76V81.18H37.8799V75.76H43.2899Z" fill="#93C4F2" />
      <path d="M43.2899 70.3501V75.7601H37.8799V70.3501H43.2899Z" fill="#93C4F2" />
      <path d="M43.2899 64.9399V70.3499H37.8799V64.9399H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 59.53V64.94H37.8799V59.53H43.2899Z" fill="#FFFEFE" />
      <path d="M43.2899 54.1201V59.5301H37.8799V54.1201H43.2899Z" fill="#93C4F2" />
      <path d="M43.2899 48.71V54.12H37.8799V48.71H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 43.29V48.7101H37.8799V43.29H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 37.8901V43.2901H37.8799V37.8901H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 32.47V37.89H37.8799V32.47H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 27.0601V32.47H37.8799V27.0601H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 21.6499V27.0599H37.8799V21.6499H43.2899Z" fill="#E1E8FA" />
      <path d="M43.2899 16.24V21.65H37.8799V16.24H43.2899Z" fill="#FFFEFE" />
      <path d="M43.2899 10.8301V16.2401H37.8799V10.8301H43.2899Z" fill="#FFFEFE" />
      <path d="M43.2899 5.40991V10.8299H37.8799V5.40991H43.2899Z" fill="#FFFEFE" />
      <path d="M37.8797 86.5901V92.0001H32.4697V86.5901H37.8797Z" fill="#70ADE6" />
      <path d="M37.8797 81.1799V86.5899H32.4697V81.1799H37.8797Z" fill="#70ADE6" />
      <path d="M37.8797 75.76V81.18H32.4697V75.76H37.8797Z" fill="#93C4F2" />
      <path d="M37.8797 70.3501V75.7601H32.4697V70.3501H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 64.9399V70.3499H32.4697V64.9399H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 59.53V64.94H32.4697V59.53H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 54.1201V59.5301H32.4697V54.1201H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 48.71V54.12H32.4697V48.71H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 43.29V48.7101H32.4697V43.29H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 37.8901V43.2901H32.4697V37.8901H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 32.47V37.89H32.4697V32.47H37.8797Z" fill="#E1E8FA" />
      <path d="M37.8797 27.0601V32.47H32.4697V27.0601H37.8797Z" fill="#FFFEFE" />
      <path d="M37.8797 21.6499V27.0599H32.4697V21.6499H37.8797Z" fill="#FFFEFE" />
      <path d="M37.8797 16.24V21.65H32.4697V16.24H37.8797Z" fill="#FFFEFE" />
      <path d="M37.8797 10.8301V16.2401H32.4697V10.8301H37.8797Z" fill="#FFFEFE" />
      <path d="M37.8797 5.40991V10.8299H32.4697V5.40991H37.8797Z" fill="#FFFEFE" />
      <path d="M32.4696 86.5901V92.0001H27.0596V86.5901H32.4696Z" fill="#70ADE6" />
      <path d="M32.4696 81.1799V86.5899H27.0596V81.1799H32.4696Z" fill="#70ADE6" />
      <path d="M32.4696 75.76V81.18H27.0596V75.76H32.4696Z" fill="#93C4F2" />
      <path d="M32.4696 70.3501V75.7601H27.0596V70.3501H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 64.9399V70.3499H27.0596V64.9399H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 59.53V64.94H27.0596V59.53H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 54.1201V59.5301H27.0596V54.1201H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 48.71V54.12H27.0596V48.71H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 43.29V48.7101H27.0596V43.29H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 37.8901V43.2901H27.0596V37.8901H32.4696Z" fill="#E1E8FA" />
      <path d="M32.4696 32.47V37.89H27.0596V32.47H32.4696Z" fill="#FFFEFE" />
      <path d="M32.4696 27.0601V32.47H27.0596V27.0601H32.4696Z" fill="#FFFEFE" />
      <path d="M32.4696 21.6499V27.0599H27.0596V21.6499H32.4696Z" fill="#FFFEFE" />
      <path d="M32.4696 16.24V21.65H27.0596V16.24H32.4696Z" fill="#FFFEFE" />
      <path d="M27.0604 86.5901V92.0001H21.6504V86.5901H27.0604Z" fill="#70ADE6" />
      <path d="M27.0604 81.1799V86.5899H21.6504V81.1799H27.0604Z" fill="#70ADE6" />
      <path d="M27.0604 75.76V81.18H21.6504V75.76H27.0604Z" fill="#93C4F2" />
      <path d="M27.0604 70.3501V75.7601H21.6504V70.3501H27.0604Z" fill="#E1E8FA" />
      <path d="M27.0604 64.9399V70.3499H21.6504V64.9399H27.0604Z" fill="#E1E8FA" />
      <path d="M27.0604 59.53V64.94H21.6504V59.53H27.0604Z" fill="#E1E8FA" />
      <path d="M27.0604 54.1201V59.5301H21.6504V54.1201H27.0604Z" fill="#E1E8FA" />
      <path d="M27.0604 48.71V54.12H21.6504V48.71H27.0604Z" fill="#E1E8FA" />
      <path d="M27.0604 43.29V48.7101H21.6504V43.29H27.0604Z" fill="#E1E8FA" />
      <path d="M27.0604 37.8901V43.2901H21.6504V37.8901H27.0604Z" fill="#FFFEFE" />
      <path d="M21.6502 81.1799V86.5899H16.2402V81.1799H21.6502Z" fill="#70ADE6" />
      <path d="M21.6502 75.76V81.18H16.2402V75.76H21.6502Z" fill="#93C4F2" />
      <path d="M21.6502 70.3501V75.7601H16.2402V70.3501H21.6502Z" fill="#E1E8FA" />
      <path d="M21.6502 64.9399V70.3499H16.2402V64.9399H21.6502Z" fill="#E1E8FA" />
      <path d="M21.6502 59.53V64.94H16.2402V59.53H21.6502Z" fill="#E1E8FA" />
      <path d="M21.6502 54.1201V59.5301H16.2402V54.1201H21.6502Z" fill="#E1E8FA" />
      <path d="M21.6502 48.71V54.12H16.2402V48.71H21.6502Z" fill="#E1E8FA" />
      <path d="M21.6502 43.29V48.7101H16.2402V43.29H21.6502Z" fill="#E1E8FA" />
      <path d="M21.6502 37.8901V43.2901H16.2402V37.8901H21.6502Z" fill="#FFFEFE" />
      <path d="M21.6502 32.47V37.89H16.2402V32.47H21.6502Z" fill="#FFFEFE" />
      <path d="M16.2403 81.1799V86.5899H10.8203V81.1799H16.2403Z" fill="#70ADE6" />
      <path d="M16.2403 75.76V81.18H10.8203V75.76H16.2403Z" fill="#70ADE6" />
      <path d="M16.2403 70.3501V75.7601H10.8203V70.3501H16.2403Z" fill="#93C4F2" />
      <path d="M16.2403 64.9399V70.3499H10.8203V64.9399H16.2403Z" fill="#E1E8FA" />
      <path d="M16.2403 59.53V64.94H10.8203V59.53H16.2403Z" fill="#E1E8FA" />
      <path d="M16.2403 54.1201V59.5301H10.8203V54.1201H16.2403Z" fill="#E1E8FA" />
      <path d="M16.2403 48.71V54.12H10.8203V48.71H16.2403Z" fill="#E1E8FA" />
      <path d="M16.2403 43.29V48.7101H10.8203V43.29H16.2403Z" fill="#E1E8FA" />
      <path d="M16.2403 37.8901V43.2901H10.8203V37.8901H16.2403Z" fill="#FFFEFE" />
      <path d="M16.2403 32.47V37.89H10.8203V32.47H16.2403Z" fill="#FFFEFE" />
      <path d="M10.8202 75.76V81.18H5.41016V75.76H10.8202Z" fill="#70ADE6" />
      <path d="M10.8202 70.3501V75.7601H5.41016V70.3501H10.8202Z" fill="#70ADE6" />
      <path d="M10.8202 64.9399V70.3499H5.41016V64.9399H10.8202Z" fill="#93C4F2" />
      <path d="M10.8202 59.53V64.94H5.41016V59.53H10.8202Z" fill="#E1E8FA" />
      <path d="M10.8202 54.1201V59.5301H5.41016V54.1201H10.8202Z" fill="#E1E8FA" />
      <path d="M10.8202 48.71V54.12H5.41016V48.71H10.8202Z" fill="#E1E8FA" />
      <path d="M10.8202 43.29V48.7101H5.41016V43.29H10.8202Z" fill="#FFFEFE" />
      <path d="M10.8202 37.8901V43.2901H5.41016V37.8901H10.8202Z" fill="#FFFEFE" />
      <path d="M10.8202 32.47V37.89H5.41016V32.47H10.8202Z" fill="#FFFEFE" />
      <path d="M5.41 70.3501V75.7601H0V70.3501H5.41Z" fill="#70ADE6" />
      <path d="M5.41 64.9399V70.3499H0V64.9399H5.41Z" fill="#93C4F2" />
      <path d="M5.41 59.53V64.94H0V59.53H5.41Z" fill="#93C4F2" />
      <path d="M5.41 54.1201V59.5301H0V54.1201H5.41Z" fill="#FFFEFE" />
      <path d="M5.41 48.71V54.12H0V48.71H5.41Z" fill="#FFFEFE" />
      <path d="M5.41 43.29V48.7101H0V43.29H5.41Z" fill="#FFFEFE" />
      <path d="M5.41 37.8901V43.2901H0V37.8901H5.41Z" fill="#FFFEFE" />
    </svg>

  );
}