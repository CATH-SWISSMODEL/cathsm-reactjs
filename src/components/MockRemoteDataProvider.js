import { Component } from "react";
import RemoteDataProvider from "RemoteDataProvider";
import PropTypes from "prop-types";

class MockRemoteDataProvider extends RemoteDataProvider {
  static defaultProps = {
    responseDuration: 0,
  };

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    console.log(`MockRemoteDataProvider().componentDidMount`);
    const interval = this.props.interval;
    this.timer = null;
    this.fetchData();
    if (interval) {
      console.log(`MockRemoteDataProvider().componentDidMount.setInterval`);
      this.timer = setInterval(() => this.fetchData(), interval);
    }
  }

  componentWillUnmount() {
    console.log("MockRemoteDataProvider().componentWillUnmount");
    clearInterval(this.timer);
  }

  fetchData() {
    const endpoint = this.props.endpoint;
    const authToken = this.props.authToken;
    const data = this.props.data;
    const method = this.props.method;

    let opts = {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      }
    };
    if (authToken) {
      opts.headers["Authorization"] = `token ${authToken}`;
    }
    if (data) {
      opts["body"] = JSON.stringify(data);
    }

    console.log(
      `Submitting data to ${endpoint}: method=${method}, auth=${authToken}, data=${data}`,
      opts
    );

    return fetch(endpoint, opts)
      .then(response => Promise.all([response.ok, response.json()]))
      .then(([responseOk, body]) => {
        if (responseOk) {
          this.props.onComplete(body);
        } else {
          const msg = body["non_field_errors"]
            ? body["non_field_errors"]
            : "Unexpected error";
          throw Error(msg);
        }
      })
      .catch(error => {
        const msg = `MockRemoteDataProvider failed to get data: ${error}`;
        console.error(msg);
        this.props.onError(msg);
      });
  }

  render() {
    return null;
  }
}

MockRemoteDataProvider.propTypes = {
  // endpoint: PropTypes.string.isRequired,
  // method: PropTypes.string.isRequired,
  // authToken: PropTypes.string,
  // data: PropTypes.object,
  // interval: PropTypes.number,
  // onError: PropTypes.func.isRequired,
  // onComplete: PropTypes.func.isRequired
  response: PropTypes.object.isRequired,
  responseDuration: PropTypes.number,
};

export default MockRemoteDataProvider;
