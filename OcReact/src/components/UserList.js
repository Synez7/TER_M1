import { useContext, useEffect, useState } from "react";
import { PostsContext } from "./PostsContext";

function UserList() {
  const { Users, setUsers } = useContext(PostsContext);
  const { update, setUpdate } = useContext(PostsContext);

  return (
    <div className="UserList">
      <h2>Users</h2>

      {Users.map((user, key) => {
        return (
          <div className="container">
            <div className="col-xs-12">
              <div className="list-group">
                <li className="list-group-item">
                  <img
                    src="user.avatarImagePath"
                    alt="avatar-image"
                    class="img-thumbnail"
                  />
                  <p style={{ color: "grey" }}>
                    {user.createdAt
                      ? user.createdAt
                      : new Date().toLocaleString()}
                  </p>
                  <h3>
                    {user._firstName} {user._lastName} ({user._gender})
                  </h3>
                  <h4>
                    Birthday:{" "}
                    {user._birthday
                      ? user._birthday
                      : new Date().toLocaleString()}
                  </h4>
                  <h4>Email: {user._email}</h4>
                  <h4>Country: {user._country}</h4>
                  <h4>Telephone: {user._telephone}</h4>
                  <div>
                    <div className="container-fluid bg-light text-dark p-2">
                      <div className="container bg-light p-2">
                        <p className="display-6">{user._bio}</p>
                      </div>
                    </div>
                  </div>
                  <h4>Favorite Number: {user._favoriteNumber}</h4>
                  <h4>Favorite Color: {user._favoriteColor}</h4>
                  <h4>
                    Level of Agreement on Survey Question:{" "}
                    {user._agreementLevel}
                  </h4>
                  <p>
                    {user._getsNewsletter
                      ? "Subscribed to newsletter."
                      : "Not subscribed to newsletter."}
                  </p>
                </li>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UserList;
