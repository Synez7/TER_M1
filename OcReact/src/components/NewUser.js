import { useContext } from "react";
import { PostsContext } from "./PostsContext";
import { Link } from "react-router-dom";
import { User } from "./User";

function NewUser() {
  const { Users, setUsers } = useContext(PostsContext);
  const { update, setUpdate } = useContext(PostsContext);

  return (
    <div class="row">
      <div class="col-sm-8 col-sm-offset-2">
        <h2>Add a new User</h2>
        <form>
          <div class="form-group">
            <label for="firstName">First Name*</label>
            <input
              type="text"
              class="form-control"
              id="firstName"
              formControlName="firstName"
            />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name*</label>
            <input
              type="text"
              class="form-control"
              id="lastName"
              formControlName="lastName"
            />
          </div>

          <div class="form-group">
            <label>Gender*</label>
            <div class="radio-inline">
              <input
                type="radio"
                class="form-check-input"
                id="gender1"
                name="gender"
                formControlName="gender"
                value="M"
              />
              <label for="gender1" class="form-check-label">
                M
              </label>
            </div>
            <div class="radio-inline">
              <input
                type="radio"
                class="form-check-input"
                id="gender2"
                name="gender"
                formControlName="gender"
                value="F"
              />
              <label for="gender2" class="form-check-label">
                F
              </label>
            </div>
            <div class="radio-inline">
              <input
                type="radio"
                class="form-check-input"
                id="gender3"
                name="gender"
                formControlName="gender"
                value="Other"
              />
              <label for="gender3" class="form-check-label">
                Other
              </label>
            </div>
          </div>
          <div class="form-group">
            <label for="email">Email*</label>
            <input
              type="email"
              class="form-control"
              id="email"
              formControlName="email"
            />
          </div>
          <div class="form-group">
            <label for="password">Password*</label>
            <input
              type="password"
              class="form-control"
              id="password"
              formControlName="password"
            />
          </div>
          <div class="form-group">
            <label for="birthday">Birthday*</label>
            <input
              type="date"
              class="form-control"
              id="birthday"
              formControlName="birthday"
            />
          </div>
          <div class="form-group">
            <label for="telephone">Telephone*</label>
            <input
              type="tel"
              class="form-control"
              id="telephone"
              formControlName="telephone"
            />
          </div>
          <div class="form-group">
            <label for="country">Country*</label>
            <select class="form-control" id="country" formControlName="country">
              <option value="France">France</option>
              <option value="USA">USA</option>
              <option value="Germany">Germany</option>
              <option value="Canada">Canada</option>
              <option value="Japan">Japan</option>
              <option value="Lebanon">Lebanon</option>
              <option value="Algeria">Algeria</option>
            </select>
          </div>
          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea
              class="form-control"
              id="bio"
              formControlName="bio"
              placeholder="Studies, Hobbies, etc."
            ></textarea>
          </div>
          <div class="form-group">
            <label for="favoriteNumber">Favorite Number</label>
            <input
              type="number"
              class="form-control"
              id="favoriteNumber"
              formControlName="favoriteNumber"
            />
          </div>
          <div class="form-group">
            <label for="favoriteColor">Favorite Color</label>
            <input
              type="color"
              class="form-control"
              id="favoriteColor"
              formControlName="favoriteColor"
            />
          </div>
          <div class="form-group">
            <p>Do you think the machine will swallow us all one day? </p>
            <input
              type="range"
              class="form-control"
              id="agreementLevel"
              formControlName="agreementLevel"
              step="20"
            />
          </div>
          <div class="form-group">
            <label for="avatarImage">Upload an avatar image</label>
            <input
              type="file"
              class="form-control"
              id="avatarImage"
              formControlName="avatarImage"
            />
          </div>
          <div class="form-group">
            <div class="checkbox-inline">
              <input
                type="checkbox"
                class="form-check-input"
                id="newsletter"
                name="newsletter"
                formControlName="newsletter"
              />
              <label for="newsletter" class="form-check-label">
                Subscribe to Newsletter
              </label>
            </div>
          </div>
        </form>
        <Link to="/users">
          <button
            className="btn btn-success"
            style={{ marginTop: "15px" }}
            onClick={() => {
              setUsers([
                ...Users,
                new User(
                  document.getElementById("firstName").value,
                  document.getElementById("lastName").value,
                  document.querySelector("input[name=gender]:checked").value,
                  document.getElementById("email").value,
                  document.getElementById("password").value,
                  document.getElementById("birthday").value,
                  document.getElementById("telephone").value,
                  document.getElementById("country").value,
                  document.getElementById("bio").value,
                  document.getElementById("favoriteNumber").value,
                  document.getElementById("favoriteColor").value,
                  document.getElementById("avatarImage").value,
                  document.getElementById("agreementLevel").value,
                  document.getElementById("newsletter").checked
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

export default NewUser;
