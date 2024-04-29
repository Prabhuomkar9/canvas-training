import React from "react";
import dynamic from "next/dynamic";

const SecondTest = dynamic(() => import("../components/secondTest"), {
  ssr: false,
});

const secondTest = () => {
  return <SecondTest />;
};

export default secondTest;
