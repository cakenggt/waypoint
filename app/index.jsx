import 'babel-polyfill';
import React from 'react';
import {Router, Route, IndexRoute, browserHistory} from 'react-router';
import {render} from 'react-dom';

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
  render: function() {
    return (
      <div></div>
    );
  }
});

var Room = React.createClass({
  render: function(){
    var room = this.props.params.room;
    var socket = io.connect('', {query: 'room='+room});
    socket.on('received', function(data){
      console.log('received a request');
      console.log(data);
    });
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
