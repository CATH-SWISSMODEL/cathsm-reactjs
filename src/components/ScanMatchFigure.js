import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  root: {
    position: "relative",
    display: "block",
    height: 7,
    "background-color": "#ddd",
  },
  match: {
    height: 7,
    position: "absolute",
    "background-color": "#c00",
  }
});

class ScanMatchFigure extends React.Component {
  render() {
    const { classes, width, sequenceLength, segments } = this.props;
    const style = { width };
    console.log('width', width, 'sequenceLength', sequenceLength);
    return (
      <div className={classes.root} style={style}>
        {segments.map(n => {
          const { id, start, end } = n;
          const w = 100 * (end - start) / sequenceLength;
          const l = 100 * start / sequenceLength;
          const spanStyle = { width: w + "%", left: l + "%" };
          return <div key={id} className={classes.match} style={spanStyle} />;
        })}
      </div>
    );
  }
}

ScanMatchFigure.defaultProps = {
  width: 250
};

ScanMatchFigure.propTypes = {
  classes: PropTypes.object.isRequired,
  sequenceLength: PropTypes.number.isRequired,
  segments: PropTypes.array.isRequired,
  width: PropTypes.number.isRequired
};

export default withStyles(styles)(ScanMatchFigure);
