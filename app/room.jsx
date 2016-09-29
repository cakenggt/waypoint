import 'babel-polyfill';
import React from 'react';
import {Router, Route, IndexRoute, IndexLink, Link, browserHistory} from 'react-router';
import {render} from 'react-dom';
import JSONTree from 'react-json-tree'

export var Room = React.createClass({
  propTypes: {
    roomsData: React.PropTypes.object,
    setRoomData: React.PropTypes.func
  },
  getInitialState: function(){
    return {};
  },
  componentDidMount: function() {
    var room = this.props.params.room;
    if (!this.props.roomsData[room]){
      this.props.createRoom(room);
    }
  },
  render: function(){
    var room = this.props.params.room;
    if (!this.props.roomsData[room]){
      return null;
    }
    var link = 'https://api-waypoint.herokuapp.com/api/v1/room/'+room;
    return (
      <div>
        <h2>Room {room}</h2>
        <span>To send a request to this room, make it to <a href={link}>{link}</a></span>
        <RequestList
          room={this.props.params.room}
          roomData={this.props.roomsData[room]}
          setRoomData={this.props.setRoomData}
          />
        <hr/>
        <RequestControl
          room={room}
          roomData={this.props.roomsData[room]}
          setRoomData={this.props.setRoomData}
          />
      </div>
    )
  }
});

var RequestList = React.createClass({
  propTypes: {
    room: React.PropTypes.string,
    roomData: React.PropTypes.shape({
      requests: React.PropTypes.array
    }),
    setRoomData: React.PropTypes.func
  },
  render: function(){
    var jsons = this.props.roomData.requests.map(function(elem, i){
      return (
        <JSONTree
          key={i}
          data={elem}/>
      );
    });
    if (!jsons.length){
      jsons.push(<span key={0}>There are not yet any requests</span>);
    }
    return (
      <div
        className="request-list">
        <h3>Received Requests</h3>
        <div
          className="json-list">
          {jsons}
        </div>
      </div>
    )
  }
});

var RequestControl = React.createClass({
  getInitialState: function(){
    return {
      uri: '',
      method: 'GET'
    }
  },
  render: function(){
    return (
      <div>
        <div
          className="request-list">
          <h3>Send Request</h3>
            <div
              className="request-controls">
              <div>
                <VerticalEntry
                  label="URI"
                  value={
                    <input
                      value={this.state.uri}
                      onChange={this.changeURI}/>
                    }/>
                <VerticalEntry
                  label="Method"
                  value={
                    <input
                      value={this.state.method}
                      onChange={this.changeMethod}/>
                    }/>
                {
                  G_RECAPTCHA_ACTIVE ?
                  <div
                    className="g-recaptcha"
                    data-sitekey="6LdS7QcUAAAAACyV8AWde4Uafu4taot8kwzwKL4g"></div> :
                  null
                }
              </div>
              <span
                className="btn"
                onClick={this.sendRequest}>Send Request</span>
            </div>
            <RequestResponseList
              list={this.props.roomData.madeRequests}/>
        </div>
      </div>
    );
  },
  sendRequest: function(){
    var request = {
      uri: this.state.uri,
      method: this.state.method
    };
    var sending = {
      uri: this.state.uri,
      method: this.state.method
    };
    if (G_RECAPTCHA_ACTIVE){
      sending.grecaptcha = grecaptcha.getResponse();
      grecaptcha.reset();
    }
    var index = this.props.roomData.madeRequests.length;
    var roomData = this.props.roomData;
    roomData.madeRequests.push({
      request: request
    });
    this.props.setRoomData(this.props.room, roomData);
    $.ajax('/api/v1/request', {
      data: sending,
      method: 'POST'
    })
    .then(data => {
      var formattedData;
      try {
        formattedData = JSON.parse(data);
      } catch(e) {
        formattedData = data;
      }
      var roomData = this.props.roomData;
      if (formattedData.error){
        roomData.madeRequests[index].response = formattedData.error;
      }
      else{
        roomData.madeRequests[index].response = formattedData.response;
      }
      this.props.setRoomData(this.props.room, roomData);
    });
  },
  changeURI: function(e){
    this.setState({uri: e.target.value});
  },
  changeMethod: function(e){
    this.setState({method: e.target.value});
  }
});

var VerticalEntry = React.createClass({
  render: function(){
    var spanStyle = {
      display: 'inline-block'
    };
    return (
      <span
        style={spanStyle}>
        <div>
          {this.props.label}
        </div>
        <div>
          {this.props.value}
        </div>
      </span>
    )
  }
});

var RequestResponseList = React.createClass({
  propTypes: {
    list: React.PropTypes.array
  },
  render: function(){
    var jsons = this.props.list.map(function(elem, i){
      return (
        <tr
          key={i}>
          <td>
            <JSONTree
              data={elem.request}/>
          </td>
          <td>
            {
              elem.response ?
              <JSONTree
                data={elem.response}/> : null
            }
          </td>
        </tr>
      );
    });
    if (!jsons.length){
      jsons.push(<tr key={0}><td>There are not yet any requests sent</td></tr>)
    }
    return (
      <div>
        <h3>Sent Request List</h3>
        <div
          className="json-list">
          <table>
            <tbody>
              {jsons}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
});
