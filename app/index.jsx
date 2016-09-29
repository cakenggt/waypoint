import 'babel-polyfill';
import React from 'react';
import {Router, Route, IndexRoute, IndexLink, Link, browserHistory, withRouter} from 'react-router';
import {render} from 'react-dom';
import {Room} from './room.jsx';

var App = React.createClass({
  getInitialState: function(){
    return {
      roomsData: {}
    }
  },
  render: function() {
    var roomNames = Object.keys(this.state.roomsData);
    var roomLinks;
    if (roomNames.length){
      var rooms = roomNames.map(function(elem, i){
        var link = '/room/'+elem;
        return (
          <Link
            to={link}
            className="link"
            activeClassName="active"
            key={i}>{elem}</Link>
        );
      })
      roomLinks = (
        <div
          className='nav'>
          {rooms}
        </div>
      );
    }
    return (
      <div className="content">
        <div
          className="header">
          <h1>Waypoint</h1>
        </div>
        <div
          className="nav">
          <IndexLink
            to="/"
            className="link"
            activeClassName="active">Home</IndexLink>
          <Link
            to="/about"
            className="link"
            activeClassName="active">About</Link>
          <Link
            to="/instructions"
            className="link"
            activeClassName="active">Instructions</Link>
        </div>
        {roomLinks}
        {React.Children.map(this.props.children, child => {
          return React.cloneElement(child, {
            roomsData: this.state.roomsData,
            setRoomData: this.setRoomData,
            createRoom: this.createRoom
          });
        })}
      </div>
    );
  },
  setRoomData: function(room, data){
    var roomsData = this.state.roomsData;
    roomsData[room] = data;
    this.setState({roomsData: roomsData});
  },
  createRoom: function(room){
    var roomsData = this.state.roomsData;
    var socket = io.connect('', {query: 'room='+room});
    socket.on('received', (data) => {
      var roomData = this.state.roomsData[room];
      roomData.requests.push(data);
      this.setRoomData(room, roomData);
    });
    roomsData[room] = {
      requests: [],
      madeRequests: [],
      socket: socket
    };
    this.setState({roomsData: roomsData});
  }
});

var Index = withRouter(React.createClass({
  getInitialState: function(){
    return {
      room: ''
    }
  },
  render: function() {
    var roomLink = '/room/'+this.state.room;
    return (
      <div
        className="room-input">
        <div>
          NAME YOUR ROOM
        </div>
        <input
          value={this.state.room}
          onChange={this.onRoomChange}
          onKeyPress={this.handleKeyPress}
          autoFocus/>
      </div>
    );
  },
  onRoomChange: function(e){
    var text = e.target.value;
    var newText = text.replace(/[^A-z0-9]/, '');
    newText = newText.toLowerCase();
    this.setState({room: newText});
  },
  handleKeyPress: function(e){
    if (e.key === 'Enter'){
      this.goToRoom();
    }
  },
  goToRoom: function(){
    var room = this.state.room;
    if (!this.props.roomsData[room]){
      this.props.createRoom(room);
    }
    this.props.router.push('/room/'+room);
  }
}));

var About = React.createClass({
  render: function(){
    return (
      <div>
        <h2>What is Waypoint?</h2>
        <p>
          Waypoint is a tool for you to test your api endpoints.
        </p>
      </div>
    );
  }
});

var Instructions = React.createClass({
  render: function(){
    return (
      <div>
        <h2>Getting a room</h2>
        <p>
          On the Home page, entering in a text room name into the text box
          and then pressing enter will take you to a room. The rooms you have
          opened this session are displayed at the top of the page, under
          the links to Home, About, and Instructions
        </p>
        <h2>Contacting a room</h2>
        <p>
          In every room there is a blue link at the top with the room's
          api url in it. Have your applications point to this link in
          order to see their requests.
        </p>
        <h2>Sending Requests from clients</h2>
        <div>
          You can send a post request from the command line with the following<br/>
          <pre><code>
            curl -X POST -d "fizz=buzz" https://api-waypoint.herokuapp.com/api/v1/room/roomName
          </code></pre>
        </div>
        <h2>Sending Requests from Waypoint</h2>
        <p>
          Waypoint has basic request ability built into the room page. From there,
          in the lower section you can input a uri and a method, and the request
          will be sent out by the backend server. The request and the response will
          both be displayed in the list following the input boxes.
        </p>
      </div>
    );
  }
})

render(
  <Router history={browserHistory}>
    <Route path="/" component={App}>
      <IndexRoute component={Index}/>
      <Route path="about" component={About}/>
      <Route path="instructions" component={Instructions}/>
      <Route path="room/:room" component={Room}/>
    </Route>
  </Router>,
  document.getElementById('app')
);
