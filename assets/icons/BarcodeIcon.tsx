import * as React from 'react';
import { SvgXml } from 'react-native-svg';

interface SvgIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const BarcodeIcon: React.FunctionComponent<SvgIconProps> = ({
  width = 24,
  height = 24,
  color = '#0088FF',
}) => {
  const xml = `
  <svg width="${width}" height="${height}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M2 5H4V19H2V5ZM6 5H8V19H6V5ZM10 5H11V19H10V5ZM13 5H16V19H13V5ZM17 5H18V19H17V5ZM20 5H22V19H20V5Z" fill="${color}"/>
  </svg>
  `;

  return <SvgXml xml={xml} />;
};

export default BarcodeIcon;