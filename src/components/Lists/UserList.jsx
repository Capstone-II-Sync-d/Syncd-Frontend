import React from "react";
import UserCard from "../Cards/UserCard";

const UserList = ({ users }) => {
  return users.length > 0 ? (
    users.map((user) => <UserCard key={user.id} user={user} />)
  ) : (
    <p>No Users found</p>
  );
};

export default UserList;
