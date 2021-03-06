import 'babel-polyfill';
import React from 'react';
import {Router, Route, IndexRoute, IndexLink, Link, browserHistory} from 'react-router';
import {render} from 'react-dom';
import JSONTree from 'react-json-tree';

var theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633'
};

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
    this.checkRecaptcha();
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
          recaptchaEnabled={this.props.recaptchaEnabled}
          />
      </div>
    )
  },
  checkRecaptcha: function(){
    $.ajax('/api/v1/recaptcha')
    .then(data => {
      this.props.setRecaptchaEnabled(data.enabled);
    });
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
    var jsons = [];
    for (var i = this.props.roomData.requests.length-1; i >= 0; i--){
      var elem = this.props.roomData.requests[i];
      jsons.push(
        <JSONTree
          key={i}
          data={elem}
          theme={theme}/>
      );
    }
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
  componentDidMount: function(){
    //This is the initial render if it is turned on
    if (this.props.recaptchaEnabled){
      console.log('rendering recaptcha');
      grecaptcha.render('g-recaptcha', {
        'sitekey': "6LdS7QcUAAAAACyV8AWde4Uafu4taot8kwzwKL4g"
      });
    }
  },
  componentDidUpdate: function(prevProps, prevState){
    //This is for if it gets turned on between a user nagivating away
    if (this.props.recaptchaEnabled && !prevProps.recaptchaEnabled){
      grecaptcha.render('g-recaptcha', {
        'sitekey': "6LdS7QcUAAAAACyV8AWde4Uafu4taot8kwzwKL4g"
      });
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
                  this.props.recaptchaEnabled ?
                  <div id="g-recaptcha"></div> :
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
    if (this.props.recaptchaEnabled){
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
    var jsons = [];
    for (var i = this.props.list.length-1; i >= 0; i--){
      var elem = this.props.list[i];
      jsons.push(
        <tr
          key={i}>
          <td>
            <JSONTree
              data={elem.request}
              theme={theme}/>
          </td>
          <td>
            {
              elem.response ?
              <JSONTree
                data={elem.response}
                theme={theme}/> : null
            }
          </td>
        </tr>
      );
    }
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
