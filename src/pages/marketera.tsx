import { NextPage } from "next";
import React from "react";
import dynamic from "next/dynamic";

const FirstTest = dynamic(() => import("../components/firstTest"), {
  ssr: false,
});

const MarketEra: NextPage = () => {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center">
      <FirstTest />
    </div>
  );
};

export default MarketEra;
