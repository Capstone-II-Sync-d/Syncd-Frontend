import React from "react";
import BusinessCard from "./BusinessCard";

const BusinessList = ({ businesses }) => {
  return (
    businesses.length > 0 ? (
      businesses.map((business) => (<BusinessCard key={business.id} business={business}/>))
    ) : (
      <p> No businesses found </p>
    )
  );
};

export default BusinessList;
