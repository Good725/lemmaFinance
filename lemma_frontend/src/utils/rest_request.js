import axios from 'axios';

export function axios_request(url, data) {
  return axios.post(url, data)
    .then((response) => {return response;})
}

export function fetch_request(url, options) {
  return fetch(url, options)
    .then((response) => {return response.json();})
}
