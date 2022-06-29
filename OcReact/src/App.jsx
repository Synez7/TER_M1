import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NaviBar from "./components/Navbar";
import Posts from "./components/Posts";
import NewPost from "./components/NewPost";
import { PostsContextProvider } from "./components/PostsContext";
import UserList from "./components/UserList";
import NewUser from "./components/NewUser";
import SearchUser from "./components/SearchUser";
import DateTimeForm from "./components/DateTimeForm";

const App = () => {
  return (
    <PostsContextProvider>
      <Router>
        <NaviBar />
        <Routes>
          <Route
            exact
            path="/posts"
            element={
              <>
                <div className="container">
                  <Posts />
                </div>
              </>
            }
          />
          <Route
            exact
            path="/new-post"
            element={
              <>
                <div className="container">
                  <NewPost />
                </div>
              </>
            }
          />
          <Route
            exact
            path="/users"
            element={
              <>
                <div className="container">
                  <UserList />
                </div>
              </>
            }
          />
          <Route
            exact
            path="/new-user"
            element={
              <>
                <div className="container">
                  <NewUser />
                </div>
              </>
            }
          />
          <Route
            exact
            path="/user-search"
            element={
              <>
                <div className="container">
                  <SearchUser />
                </div>
              </>
            }
          />
          <Route
            exact
            path="/date-time-form"
            element={
              <>
                <div className="container">
                  <DateTimeForm />
                </div>
              </>
            }
          />
        </Routes>
      </Router>
    </PostsContextProvider>
  );
};

export default App;
