import { useContext, useState } from "react";
import { PostsContext } from "./PostsContext";

function DateTimeForm() {
  const [dateTimeItem, setDateTimeItem] = useState({
    date: {
      dateTime: null,
      time: null,
      month: null,
      week: null,
    },
  });
  const { update, setUpdate } = useContext(PostsContext);

  return (
    <div class="container">
      <div class="col-xs-12">
        <form>
          <div class="form-group">
            <label for="dateTime">Local Date-Time: </label>
            <input
              type="datetime-local"
              class="form-control"
              formControlName="dateTime"
              id="dateTime"
            />
          </div>
          <div class="form-group">
            <label for="time">Time: </label>
            <input
              type="time"
              class="form-control"
              formControlName="time"
              id="time"
            />
          </div>
          <div class="form-group">
            <label for="month">Month: </label>
            <input
              type="month"
              class="form-control"
              formControlName="month"
              id="month"
            />
          </div>
          <div class="form-group">
            <label for="week">Week: </label>
            <input
              type="week"
              class="form-control"
              formControlName="week"
              id="week"
            />
          </div>
        </form>
        <button
          onClick={() => {
            dateTimeItem.date.dateTime =
              document.getElementById("dateTime").value;
            dateTimeItem.date.time = document.getElementById("time").value;
            dateTimeItem.date.month = document.getElementById("month").value;
            dateTimeItem.date.week = document.getElementById("week").value;
            setUpdate(!update);
          }}
        >
          Update Values
        </button>
        <h1>Results</h1>
        <div class="list-group">
          <li class="list-group-item">
            <h2>
              Local Date-Time:
              {dateTimeItem.date.dateTime}
            </h2>
          </li>
          <li class="list-group-item">
            <h2>Time: {dateTimeItem.date.time}</h2>
          </li>
          <li class="list-group-item">
            <h2>Month: {dateTimeItem.date.month}</h2>
          </li>
          <li class="list-group-item">
            <h2>Week: {dateTimeItem.date.week}</h2>
          </li>
        </div>
      </div>
    </div>
  );
}

export default DateTimeForm;
