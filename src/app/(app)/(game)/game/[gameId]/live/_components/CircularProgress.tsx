// --- CircularProgress Component ---
// This component renders the SVG arc and the moving dot.
const CircularProgress = ({
  size,
  strokeWidth,
  color,
  percentage,
}: {
  size: number;
  strokeWidth: number;
  color: string;
  percentage: number;
}) => {
  // --- FIX 1: Adjust radius to prevent dot from being cut off ---
  // We make the radius smaller by the dot's radius (strokeWidth)
  // so the dot (radius=strokeWidth) fits inside the viewBox.
  const radius = size / 2 - strokeWidth;
  const viewBox = `0 0 ${size} ${size}`;
  const center = size / 2;

  // --- FIX 2: Make the arc gap smaller ---
  // We'll use a 30-degree gap (from 75 to 105 degrees)
  // This makes the total arc 330 degrees.
  const arcStartAngle = 105;
  //   const arcEndAngle = 75; // This isn't used directly, just for logic
  const totalArcDegrees = 330;

  // Calculate the end angle based on the percentage
  const endAngle = arcStartAngle + (percentage / 100) * totalArcDegrees;

  // Get the path data for the arc
  const arcPath = describeArc(center, center, radius, arcStartAngle, endAngle);
  // Get the position for the dot at the end of the arc
  const dotPosition = polarToCartesian(center, center, radius, endAngle);

  return (
    <svg width={size} height={size} viewBox={viewBox}>
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="butt"
        style={{ transition: "d 1s linear" }}
      />
      {/* The dot at the tip of the countdown circle */}
      <circle
        cx={dotPosition.x}
        cy={dotPosition.y}
        r={strokeWidth}
        fill={color}
        style={{ transition: "cx 1s linear, cy 1s linear" }}
      />
    </svg>
  );
};

// --- SVG Helper Functions ---

/**
 * Converts polar coordinates (angle, radius) to Cartesian coordinates (x, y).
 * @param {number} centerX - The x-coordinate of the center.
 * @param {number} centerY - The y-coordinate of the center.
 * @param {number} radius - The radius of the circle.
 * @param {number} angleInDegrees - The angle (0 is 3 o'clock).
 * @returns {{x: number, y: number}}
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Describes an SVG arc path.
 * @param {number} x - Center x.
 * @param {number} y - Center y.
 * @param {number} radius - Arc radius.
 * @param {number} startAngle - Start angle (0 is 3 o'clock).
 * @param {number} endAngle - End angle.
 * @returns {string} - SVG path data string.
 */
function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  const d = [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");

  return d;
}

export default CircularProgress;
