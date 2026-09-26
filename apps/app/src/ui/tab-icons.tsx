// Tab bar icons: simple line icons on the brand palette (the hill, people together, a guide, you).
import Svg, { Circle, Path } from "react-native-svg";

type P = { color: string; size?: number; filled?: boolean };

export const TodayIcon = ({ color, size = 24, filled }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={17.5} cy={6.5} r={2.6} fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} />
    <Path d="M2 20.5 L9 9 L13 15 L15.5 11.5 L22 20.5 Z" fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
  </Svg>
);

export const TogetherIcon = ({ color, size = 24, filled }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={8.5} cy={8} r={3.2} fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} />
    <Circle cx={16.5} cy={9} r={2.6} stroke={color} strokeWidth={1.8} />
    <Path d="M2.5 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M15.5 14.4c2.7-.4 5 1.2 5.8 4.4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const GuideIcon = ({ color, size = 24, filled }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-4.5 3.5V17.5H4A1.5 1.5 0 0 1 2.5 16V7A1.5 1.5 0 0 1 4 5.5Z" fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M12 8.2l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9Z" fill={filled ? "#0A0A0A" : color} />
  </Svg>
);

export const YouIcon = ({ color, size = 24, filled }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={8.5} r={3.8} fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} />
    <Path d="M4.5 20.5c.9-3.8 3.9-6 7.5-6s6.6 2.2 7.5 6" fill={filled ? color : "none"} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const ChevronLeft = ({ color, size = 22 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 4.5 7.5 12 15 19.5" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CloseIcon = ({ color, size = 14 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <Path d="M2 2l10 10M12 2L2 12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ChevronRight = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path d="M6 3l5 5-5 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SpeakerIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <Path d="M2.5 6v4h2.6L9 13V3L5.1 6H2.5z" fill={color} />
    <Path d="M11.2 5.4a3.6 3.6 0 010 5.2M12.9 3.8a6 6 0 010 8.4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);
