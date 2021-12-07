'use strict';

import React from 'react';
import _ from 'lodash';
import Moment from 'moment';
import update from 'react-addons-update';
import { Dygraph } from 'react-dygraphs';

const style = {
  backgroundColor: 'white',
  fontFamily: 'Helvetica, Arial, sans-serif',
  padding: '20px',
  border: '1px solid #ccc',
  marginBottom: '30px',
  actions: {
    marginBottom: 10,
    action: {
      display: 'inline-block',
      marginRight: 5
    }
  }
};

const displayLines = {
  incoming: { label: 'Incoming', color: '#6d6' },
  outgoing: { label: 'Outgoing', color: '#d66' },
  net: { label: 'Net', color: '#6ad' },
  balance: { label: 'Balance', color: '#999' }
};

const groupByButtonValues = [
  { title: 'Day', key: 'day', number: 1 },
  { title: 'Weeks', key: 'week', number: 1 },
  { title: 'Months', key: 'month', number: 1 },
  { title: '3M', key: 'month', number: 3 },
  { title: '6M', key: 'month', number: 6 },
  { title: 'Year', key: 'year', number: 1 },
];

const groupByTypeButtonValues = [
  ['Start of period', 'start'],
  ['Rolling period', 'rolling'],
];

/**
 * The chart that shows the transactions' net, value, etc. over time.
 */
export class Chart extends React.Component {
  /**
   * Extends React.Component.constructor(). Sets default state.
   */
  constructor () {
    super();
    this.state = {
      groupBy: 'week',
      groupByType: 'start',
      groupByNumber: 1,
      displayLines: { incoming: true, outgoing: true }
    };
  }
  /**
   * Before mounting, listen for socket events.
   */
  componentWillMount () {
    this.props.sockets.stats.on('stats:receive', (err, data) => {
      if (err) return console.error(err.stack);
      if (data.id !== 'Chart') return;
      this.setState({ stats: data.data });
    });
    this.props.sockets.statements.on('statements:receive', (err) => {
      if (err) return console.log(err.stack);
      this.loadData();
    });
  }
  /**
   * When the component has mounted, load in the initial data.
   */
  componentDidMount () {
    this.loadData();
  }
  /**
   * Get the stats data (grouped transactions) based on options passed in.
   *
   * @param {Object} opts
   *   An object containing any options to send to the server.
   */
  loadData (opts = {}) {
    let groupBy = this.state.groupBy;
    let groupByType = this.state.groupByType;
    let groupByNumber = this.state.groupByNumber;
    if (opts.groupBy !== undefined) {
      this.setState({ groupBy: opts.groupBy });
      groupBy = opts.groupBy;
    }
    if (opts.groupByType !== undefined) {
      this.setState({ groupByType: opts.groupByType });
      groupByType = opts.groupByType;
    }
    if (opts.groupByNumber !== undefined) {
      this.setState({ groupByNumber: opts.groupByNumber });
      groupByNumber = opts.groupByNumber;
    }
    this.props.sockets.stats.emit('stats:request', { id: 'Chart', groupBy, groupByType, groupByNumber });
  }
  /**
   * Show and hide (toggle) the graph lines displayed.
   *
   * @param {String} lineKey
   *   The key of the the line as defined in this.state.displayLines.
   */
  toggleLine (lineKey) {
    if (!lineKey) return;
    this.setState({
      displayLines: update(this.state.displayLines, {
        $merge: { [lineKey]: !this.state.displayLines[lineKey] }
      })
    });
  }

  /**
   * Render the chart output. Should be broken down and compontentised.
   *
   * @return {ReactElement}
   */
  render () {
    if (!this.state.stats || !this.state.stats.length) return <div>Loading chart...</div>;

    const graphData = _.map(this.state.stats, (row, index) => {
      const output = [new Date(Moment(row.Date, 'DD/MM/YYYY'))];
      _.each(displayLines, (displayLine, key) => {
        if (!this.state.displayLines[key]) return;
        switch (key) {
          case 'incoming':
            output.push(parseFloat(row.incoming)); break;
          case 'outgoing':
            output.push(-parseFloat(row.outgoing)); break;
          case 'net':
            output.push(parseFloat(row.net)); break;
          case 'balance':
            output.push(parseFloat(row.balance)); break;
          default:
            output.push(0); break;
        }
      });
      return output;
    });

    const labels = ['Date'];
    const colors = [];
    const displayLinesButtons = _.map(displayLines, (displayLine, key) => {
      if (this.state.displayLines[key]) {
        labels.push(displayLine.label);
        colors.push(displayLine.color);
      }
      return (
        <button style={style.actions.action} onClick={this.toggleLine.bind(this, key)} key={key}>
          {displayLine.label}
        </button>
      );
    });
    const groupButtons = _.map(groupByButtonValues, (groupBy) => {
      return (
        <button
          style={style.actions.action}
          disabled={this.state.groupBy === groupBy.key && this.state.groupByNumber === groupBy.number}
          onClick={this.loadData.bind(this, { groupBy: groupBy.key, groupByNumber: groupBy.number })}
          key={groupBy.key}
        >
          {groupBy.title}
        </button>
      );
    });
    const groupByTypeButtons = (
      <select onChange={ (event) => this.loadData({ groupByType: event.target.value }) } value={ this.state.groupByType }>
        {
          _.map(groupByTypeButtonValues, (groupByType) => {
            return <option value={groupByType[1]} key={groupByType[1]}>{groupByType[0]}</option>;
          })
        }
      </select>
    );

    return (
      <div>
        <div style={style.actions}>
          <button style={style.actions.action} onClick={this.loadData.bind(this, null)}>Refresh</button>
          {groupButtons}
          {groupByTypeButtons}
          { /* <input type="number" onChange={ (event) => this.loadData({ groupByNumber: event.target.value }) } value={ this.state.groupByNumber } /> */ }
          {displayLinesButtons}
        </div>
        <div style={style}>
          <Dygraph
            data={graphData}
            labels={labels}
            height={600}
            colors={colors}
            gridLineColor={'#ddd'}
            axisLabelColor={'#666'}
            axisLineColor={'#666'}
            axisLabelFontSize={11}
          />
        </div>
      </div>
    );
  }
}
