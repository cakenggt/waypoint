import 'babel-polyfill';
import React from 'react';
import {Router, Route, IndexRoute, Link, browserHistory} from 'react-router';
import {render} from 'react-dom';
import JSONTree from 'react-json-tree'

var App = React.createClass({
  render: function() {
    return (
      <div className="content">
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
    return (
      <div>
        <RequestList
          socket={this.state.socket}
          room={this.props.params.room}
          />
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
  propTypes: {
    socket: React.PropTypes.object
  },
  getInitialState: function(){
    return {
      history: []
    }
  },
  componentWillReceiveProps: function(nextProps){
    if (!this.props.socket && nextProps.socket){
      nextProps.socket.on('response', (data) => {
        //This is when the server receives a response from the request
        var history = this.state.history;
        history.push(data);
        this.setState({history: history});
      });
    }
  },
  render: function(){
    //Should be a control to send a request, and then a view of the history of the
    //requests and their responses
    return null;
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
