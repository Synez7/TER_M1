import React, { useState, createContext } from "react";
import { Post } from "./Post";
import { User } from "./User";
export const PostsContext = createContext(undefined);

export const PostsContextProvider = (props) => {
  const [Posts, setPosts] = useState([
    new Post("My First Post", "Something, something, something, dark side..."),
    new Post("My Second Post", "Sometimes yes, but mostly not."),
    new Post("Another Post", "The Good, the Bad, and the what now?"),
  ]);

  const [Users, setUsers] = useState([
    new User(
      "John",
      "Doe",
      "M",
      "example@gmail.com",
      "SomethingSomething",
      "haha",
      "612345678",
      "France",
      "Something, Something, Darkside",
      "1",
      "#000000",
      "somePath/to/an/image",
      "50",
      false
    ),
  ]);
  const [selectedPost, setSelectedPost] = useState(null);

  const [update, setUpdate] = useState(false);

  const addPosts = (Post) => {
    setPosts([...Posts, Post]);
  };
  return (
    <PostsContext.Provider
      value={{
        Posts,
        setPosts,
        addPosts,
        selectedPost,
        setSelectedPost,
        update,
        setUpdate,
        Users,
        setUsers,
      }}
    >
      {props.children}
    </PostsContext.Provider>
  );
};
