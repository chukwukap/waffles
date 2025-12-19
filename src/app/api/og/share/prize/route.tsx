// TODO: Convert this to next Image response

export async function GET() {

    return new Response("Hello", {
        headers: {
            "Content-Type": "text/plain",
        },
    });
}


// import React from 'react';

// const WafflesWinCard = () => {
//     return (
//         <div className="min-h-screen bg-[#1a1818] flex items-center justify-center p-4 font-pixel overflow-hidden">
//             {/* Font Injection */}
//             <style>
//                 {`
//           @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
//           .font-pixel {
//             font-family: 'Press Start 2P', monospace; 
//           }
//           .text-retro-shadow {
//             text-shadow: 4px 4px 0px #000000;
//           }
//           .card-bg {
//             background: radial-gradient(50% 50% at 50% 50%, #2A2A2A 0%, #111111 100%);
//           }
//         `}
//             </style>

//             {/* Main Card */}
//             <div className="relative w-full max-w-[600px] flex flex-col items-center justify-start py-12 card-bg rounded-xl shadow-2xl border border-gray-800">

//                 {/* 1. WAFFLE LOGO */}
//                 {/* Dimensions: 77.47px x 14.72px */}
//                 <div className="mb-8 relative z-20">
//                     <img
//                         src="image_a35bfc.png"
//                         alt="Waffles"
//                         style={{ width: '77.47px', height: '14.72px' }}
//                         className="object-contain"
//                         onError={(e) => {
//                             e.target.style.display = 'none';
//                             e.target.parentElement.innerHTML = '<span class="text-white text-xs">WAFFLES</span>';
//                         }}
//                     />
//                 </div>

//                 {/* 2. MAIN CONTENT AREA (Text + PFP) */}
//                 <div className="relative w-[400px] h-[250px]">

//                     {/* THE PFP - FLOWING BEFORE "JUST WON" */}
//                     <div
//                         className="absolute z-10 border border-black rounded-md overflow-hidden bg-gray-300"
//                         style={{
//                             width: '30.999999840504657px',
//                             height: '30.999999840504657px',
//                             transform: 'rotate(16.23deg)',
//                             top: '72px',
//                             left: '125px',
//                             boxShadow: '2px 2px 0px rgba(0,0,0,0.5)'
//                         }}
//                     >
//                         <img
//                             src="image_a35559.png"
//                             alt="PFP"
//                             className="w-full h-full object-cover"
//                             onError={(e) => e.target.style.backgroundColor = '#ccc'}
//                         />
//                     </div>

//                     {/* CURVED TEXT SVG */}
//                     <svg viewBox="0 0 400 250" className="w-full h-full absolute top-0 left-0 pointer-events-none">

//                         {/* Top Curve: Arches over the PFP */}
//                         <path id="curveUp" d="M 50,120 Q 200,50 350,120" fill="transparent" />

//                         {/* Middle Curve: The Prize (Nested between top and bottom) */}
//                         <path id="curveMiddle" d="M 50,165 Q 200,95 350,165" fill="transparent" />

//                         {/* Bottom Curve: Arches underneath */}
//                         <path id="curveDown" d="M 50,210 Q 200,140 350,210" fill="transparent" />

//                         {/* "JUST WON" Text */}
//                         <text width="400">
//                             <textPath
//                                 xlinkHref="#curveUp"
//                                 startOffset="58%"
//                                 textAnchor="middle"
//                                 className="fill-white text-[24px] font-pixel uppercase tracking-widest"
//                                 style={{ filter: 'drop-shadow(4px 4px 0px #000)' }}
//                             >
//                                 Just Won
//                             </textPath>
//                         </text>

//                         {/* "$900,000" Prize Text (Curved) */}
//                         <text width="400">
//                             <textPath
//                                 xlinkHref="#curveMiddle"
//                                 startOffset="50%"
//                                 textAnchor="middle"
//                                 className="fill-[#4ADE80] text-[32px] font-pixel tracking-tighter"
//                                 style={{ filter: 'drop-shadow(4px 4px 0px #000)' }}
//                             >
//                                 $900,000
//                             </textPath>
//                         </text>

//                         {/* "ON WAFFLES" Text */}
//                         <text width="400">
//                             <textPath
//                                 xlinkHref="#curveDown"
//                                 startOffset="50%"
//                                 textAnchor="middle"
//                                 className="fill-white text-[24px] font-pixel uppercase tracking-widest"
//                                 style={{ filter: 'drop-shadow(4px 4px 0px #000)' }}
//                             >
//                                 On Waffles
//                             </textPath>
//                         </text>
//                     </svg>

//                 </div>

//                 {/* 3. TREASURE CHEST */}
//                 <div className="relative z-10 mt-[-20px]">
//                     <img
//                         src="image_a3581f.png"
//                         alt="Chest"
//                         className="w-[260px] object-contain drop-shadow-xl"
//                         onError={(e) => {
//                             e.target.style.display = 'none';
//                             e.target.parentElement.innerHTML = '<div class="w-32 h-20 bg-yellow-600 border-4 border-black"></div>';
//                         }}
//                     />
//                 </div>

//                 {/* 4. BUTTON */}
//                 <button
//                     className="mt-12 px-8 py-4 bg-[#1a1a1a] border-[3px] border-[#FCD34D] rounded-full 
//                      text-[#FCD34D] font-pixel text-[12px] hover:bg-[#FCD34D] hover:text-black 
//                      transition-all duration-200 tracking-wider shadow-[0_0_15px_rgba(252,211,77,0.3)]
//                      uppercase"
//                 >
//                     playwaffles.fun
//                 </button>

//             </div>
//         </div>
//     );
// };

// export default WafflesWinCard;