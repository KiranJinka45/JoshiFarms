import React from 'react';
import { Outlet } from 'react-router-dom';
const DriverLayout: React.FC = () => {
  return <div className="flex-1 bg-white"><Outlet /></div>;
};
export default DriverLayout;
