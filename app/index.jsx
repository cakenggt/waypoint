import 'babel-polyfill';
import React from 'react';
import {Router, Route, IndexRoute, Link, browserHistory} from 'react-router';
import {render} from 'react-dom';
import JSONTree from 'react-json-tree'

var App = React.createClass({
  render: function() {
    return (
      <div className="content">
        <h1>Waypoint</h1>
        {React.Children.map(this.props.children, child => {
          return React.cloneElement(child, {
            data: this.state
          });
        })}
      </div>
    );
  }
});

var Index = React.createClass({
  getInitialState: function(){
    return {
      room: ''
    }
  },
  render: function() {
    var roomLink = '/room/'+this.state.room;
    return (
      <div>
        <input
          value={this.state.room}
          onChange={this.onRoomChange}/>
        <Link to={roomLink}>Go</Link>
      </div>
    );
  },
  onRoomChange: function(e){
    var text = e.target.value;
    var newText = text.replace(/[^A-z0-9]/, '');
    newText = newText.toLowerCase();
    this.setState({room: newText});
  }
});

var Room = React.createClass({
  getInitialState: function(){
    return {};
  },
  componentDidMount: function() {
    var room = this.props.params.room;
    this.setState({
      socket: io.connect('', {query: 'room='+room})
    });
  },
  render: function(){
    var room = this.props.params.room;
    var link = 'https://api-waypoint.herokuapp.com/api/v1/room/'+room;
    return (
      <div>
        <h2>Room {room}</h2>
        <span>To send a request to this room, make it to <a href={link}>{link}</a></span>
        <RequestList
          socket={this.state.socket}
          room={this.props.params.room}
          />
        <RequestControl/>
      </div>
    )
  }
});

var RequestList = React.createClass({
  propTypes: {
    socket: React.PropTypes.object,
    room: React.PropTypes.string
  },
  getInitialState: function(){
    return {
      requests: []
    }
  },
  componentWillReceiveProps: function(nextProps){
    if (!this.props.socket && nextProps.socket){
      var room = this.props.room;
      nextProps.socket.on('received', (data) => {
        console.log('received a request');
        console.log(data);
        var requests = this.state.requests;
        requests.push(data);
        this.setState({requests: requests});
      });
    }
  },
  render: function(){
    var jsons = this.state.requests.map(function(elem, i){
      return (
        <JSONTree
          key={i}
          data={elem}/>
      );
    });
    return (
      <div>
        {jsons}
      </div>
    )
  }
});

var RequestControl = React.createClass({
  getInitialState: function(){
    return {
      history: [],
      uri: '',
      method: 'GET'
    }
  },
  render: function(){
    return (
      <div>
        <input
          value={this.state.uri}
          onChange={this.changeURI}/>
        <input
          value={this.state.method}
          onChange={this.changeMethod}/>
        {
          G_RECAPTCHA_ACTIVE ?
          <div
            className="g-recaptcha"
            data-sitekey="6LdS7QcUAAAAACyV8AWde4Uafu4taot8kwzwKL4g"></div> :
          null
        }
        <span
          onClick={this.sendRequest}>Send Request</span>
        <RequestResponseList
          list={this.state.history}/>
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
    var index = this.state.history.length;
    var history = this.state.history;
    history.push({
      request: request
    });
    this.setState({history: history});
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
      var history = this.state.history;
      if (formattedData.error){
        history[index].response = formattedData.error;
      }
      else{
        history[index].response = formattedData.response;
      }
      this.setState({history: history});
    });
  },
  changeURI: function(e){
    this.setState({uri: e.target.value});
  },
  changeMethod: function(e){
    this.setState({method: e.target.value});
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
    return (
      <div>
        <table>
          <tbody>
            {jsons}
          </tbody>
        </table>
      </div>
    )
  }
});

render(
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Index}/>
      <Route path="room/:room" component={Room}/>
    </Route>
  </Router>,
  document.getElementById('app')
);
