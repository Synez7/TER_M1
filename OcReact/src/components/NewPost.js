import { Post } from "./Post";
import { useContext } from "react";
import { PostsContext } from "./PostsContext";
import { Link } from "react-router-dom";

function NewPost() {
  const { Posts, setPosts } = useContext(PostsContext);
  const { update, setUpdate } = useContext(PostsContext);

  return (
    <div class="row">
      <div
        class="col-sm-8 col-sm-offset-2"
        style={{ position: "absolute", left: "15%", top: "7%" }}
      >
        <h2>Add a new Post</h2>
        <form>
          <div className="form-group">
            <label for="title">Title</label>
            <input
              type="text"
              className="form-control"
              id="title"
              formControlName="title"
            />
          </div>
          <div className="form-group">
            <label for="content">Content</label>
            <input
              type="text"
              class="form-control"
              id="content"
              formControlName="content"
            />
          </div>
        </form>
        <Link to="/posts">
          <button
            className="btn btn-success"
            style={{ marginTop: "15px" }}
            onClick={() => {
              setPosts([
                ...Posts,
                new Post(
                  document.getElementById("title").value,
                  document.getElementById("content").value
                ),
              ]);
              setUpdate(!update);
            }}
          >
            Create Post
          </button>
        </Link>
      </div>
    </div>
  );
}

export default NewPost;
