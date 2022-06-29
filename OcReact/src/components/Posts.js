import { useContext, useEffect, useState } from "react";
import { PostsContext } from "./PostsContext";

function Posts() {
  const { Posts, setPosts } = useContext(PostsContext);
  const { update, setUpdate } = useContext(PostsContext);

  return (
    <div className="Posts">
      <h2>Posts</h2>
      {Posts.map((post, key) => {
        return (
          <div className="container">
            <div className="col-xs-12">
              <div className="list-group">
                <li
                  className={`list-group-item ${
                    post.loveIts > 0 ? "list-group-item-success" : ""
                  } ${post.loveIts < 0 ? "list-group-item-danger" : ""}`}
                >
                  <p style={{ color: "grey" }}>
                    {post.date ? post.date : new Date().toLocaleString()}
                  </p>
                  <h2>{post.title}</h2>
                  <p>{post.content}</p>
                  <button
                    type="button"
                    className="btn btn-success"
                    style={{
                      color: "white",
                      backgroundColor: "green",
                      margin: "10px",
                    }}
                    onClick={() => {
                      post.loveIts++;
                      setUpdate(!update);
                    }}
                  >
                    Love it!
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    style={{ color: "white", backgroundColor: "red" }}
                    onClick={() => {
                      post.loveIts--;
                      setUpdate(!update);
                    }}
                  >
                    Don't love it!
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary float-lg-end"
                    onClick={() => {
                      Posts.splice(key, 1);
                      setUpdate(!update);
                    }}
                  >
                    Delete
                  </button>
                </li>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Posts;
