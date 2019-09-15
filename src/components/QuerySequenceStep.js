import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Divider from '@material-ui/core/Divider';
import CardActions from '@material-ui/core/CardActions';
import Fab from '@material-ui/core/Fab';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import CreateIcon from '@material-ui/icons/Create';

import MockCathScanResults from "../models/test_data/CathScanResults.test.js";
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

const INVALID_AA_CHARS = /[^ARNDCQEGHILKMFPSTWYVBZ]/mg;

const styles = theme => ({
  root: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  section: {
    margin: theme.spacing(1, 0),
  },
  buttonBar: {
    justifyContent: 'center',
    width: '100%',
  },
  helpTitle: {
    fontSize: 14,
  },
  formControl: {

  },
  exampleButton: {
    margin: theme.spacing(1),
  },
  querySequence: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  querySequenceInput: {
    fontFamily: "Consolas, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono, Courier New, monospace",
    fontSize: 12,
    lineHeight: 1.2,
  },
});

const exampleSequences = {
  'A0A0Q0Y989': 'MNDFHRDTWAEVDLDAIYDNVANLRRLLPDDTHIMAVVKANAYGHGDVQVARTALEAGASRLAVAFLDEALALREKGIEAPILVLGASRPADAALAAQQRIALTVFRSDWLEEASALYSGPFPIHFHLKMDTGMGRLGVKDEEETKRIVALIERHPHFVLEGVYTHFATADEVNTDYFSYQYTRFLHMLEWLPSRPPLVHCANSAASLRFPDRTFNMVRFGIAMYGLAPSPGIKPLLPYPLKEAFSLHSRLVHVKKLQPGEKVSYGATYTAQTEEWIGTIPIGYADGWLRRLQHFHVLVDGQKAPIVGRICMDQCMIRLPGPLPVGTKVTLIGRQGDEVISIDDVARHLETINYEVPCTISYRVPRIFFRHKRIMEVRNAIGRGESSA',
  'O014992': 'MSVVGIDLGFQSCYVAVARAGGIETIANEYSDRCTPACISFGPKNRSIGAAAKSQVISNAKNTVQGFKRFHGRAFSDPFVEAEKSNLAYDIVQLPTGLTGIKVTYMEEERNFTTEQVTAMLLSKLKETAESVLKKPVVDCVVSVPCFYTDAERRSVMDATQIAGLNCLRLMNETTAVALAYGIYKQDLPALEEKPRNVVFVDMGHSAYQVSVCAFNRGKLKVLATAFDTTLGGRKFDEVLVNHFCEEFGKKYKLDIKSKIRALLRLSQECEKLKKLMSANASDLPLSIECFMNDVDVSGTMNRGKFLEMCNDLLARVEPPLRSVLEQTKLKKEDIYAVEIVGGATRIPAVKEKISKFFGKELSTTLNADEAVTRGCALQCAILSPAFKVREFSITDVVPYPISLRWNSPAEEGSSDCEVFSKNHAAPFSKVLTFYRKEPFTLEAYYSSPSGFALSRSQFSVQKVLLSLMAPVQK',
};

class QuerySequenceStep extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      error: false,
      errorMessage: null,
      querySequenceIdError: false,
      querySequenceError: false,
      querySequenceId: this.props.queryId || "",
      querySequence: this.props.querySequence || "",
      submitLabel: this.props.submitLabel || 'Search',
      isLocked: this.props.locked || false,
      isValid: false,
    };

    // This binding is necessary to make `this` work in the callback
    this._handleTextFieldChange = this._handleTextFieldChange.bind(this);
    this._handleSubmit = this._handleSubmit.bind(this);
    this._handleUnlock = this._handleUnlock.bind(this);
    this._handleChange = this._handleChange.bind(this);
    this._handleClear = this._handleClear.bind(this);
    this._handleExampleClick = this._handleExampleClick.bind(this);
    this._handleExampleResultClick = this._handleExampleResultClick.bind(this);
    this.setSequenceFromFasta = this.setSequenceFromFasta.bind(this);
  }

  clearState() {
    this.setState({
      error: false,
      errorMessage: null,
      querySequenceIdError: false,
      querySequenceError: false,
      querySequenceId: "",
      querySequence: "",
      submitLabel: this.props.submitLabel || 'Search',
      isValid: false,
      isLocked: this.props.locked || false
    });
  }

  componentDidMount() {
    this.validateForm();
  }

  componentDidUpdate(prevProps) {
    let data = {};

    if (prevProps.queryId !== this.props.queryId) {
      data['querySequenceId'] = this.props.queryId;
    }
    if (prevProps.querySequence !== this.props.querySequence) {
      data['querySequence'] = this.props.querySequence;
    }
    if (prevProps.locked !== this.props.locked) {
      data['locked'] = this.props.locked;
    }
    if (Object.keys(data).length) {
      this.setState(data);
    }
  }

  validateForm() {
    let seqError = false;
    let seqIdError = false;

    const querySequenceId = this.state.querySequenceId;
    let querySequence = this.state.querySequence;

    if (querySequence !== '') {
      querySequence = querySequence.replace(/\s/mg, '');
      const invalidChars = INVALID_AA_CHARS.exec(querySequence);
      if (invalidChars) {
        seqError = `Found unexpected character ${invalidChars} in query sequence`;
      }
    }

    const isValid = querySequence && querySequenceId && !(seqError || seqIdError) ? true : false;

    this.setState({
      querySequenceError: seqError,
      querySequenceIdError: seqIdError,
      isValid: isValid,
    });
  }

  setError(msg) {
    this.setState(state => {
      return {
        error: true,
        errorMessage: msg,
      }
    });
  }

  _handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({ [name]: value }, this.validateForm);
  }

  _handleClear(ev) {
    this.clearState();
  }

  _handleTextFieldChange(e) {
    const queryFasta = e.target.value;
    this.setSequenceFromFasta(queryFasta);
  }

  _handleSubmit(ev) {
    const { querySequence, querySequenceId } = this.state;
    this.props.onSubmit(ev, { id: querySequenceId, seq: querySequence });
  }

  _handleUnlock(ev) {
    if (this.props.onUnlock) {
      this.props.onUnlock(ev);
    }
  }

  setSequenceFromFasta(queryFasta) {
    this.setState({ queryFasta });
    queryFasta = queryFasta.trim();
    if (queryFasta === "") {
      this.setState({ error: false, errorMessage: null, queryId: null, querySequence: null });
      return;
    }
    const { id, seq } = this.parseFasta(queryFasta);
    console.log("Calling onChange with seq details", this.props, id, seq);
    this.props.onChange(id, seq);
  }

  parseFasta(queryFasta) {
    const lines = queryFasta.split('\n');
    const header = lines.shift();
    if (!header.startsWith('>')) {
      return this.setError("Expected FASTA header to start with '>'");
    }
    const id_re = /^>(\S+)/;
    const id_match = header.match(id_re);
    if (!id_match) {
      return this.setError(`Failed to parse ID from FASTA header '${header}'`);
    }
    const id = id_match[1];
    let seq = '';
    lines.forEach(function (line, line_num) {
      if (line.match(id_re)) {
        return;
      }
      seq += line.trim();
    });
    return { id, seq };
  }

  _handleExampleClick(exampleId) {
    const exampleSeq = exampleSequences[exampleId];
    console.log("_handleExampleClick", exampleId, exampleSeq);
    this.setState({
      querySequenceId: exampleId,
      querySequence: exampleSeq,
    }, this.validateForm);
  }

  _handleExampleResultClick(ev) {
    const exampleResponse = MockCathScanResults;
    const resultsData = JSON.parse(exampleResponse['results_json']);
    const { id, seq } = this.parseFasta(resultsData['query_fasta']);
    this.props.onMockResult(id, seq, exampleResponse);
  }

  getFasta() {
    if (this.state.queryId && this.state.querySequence) {
      return '>' + this.state.queryId + '\n' + this.state.querySequence + '\n';
    }
    else {
      return;
    }
  }

  renderError() {

  }

  render() {
    const { classes, locked } = this.props;

    const { isValid, submitLabel, querySequence, querySequenceId, querySequenceError, querySequenceIdError } = this.state;

    return (
      <div className={classes.root}>
        <div className={classes.section}>
          <FormControl>
            <TextField
              InputProps={{ classes: { input: classes.querySequenceInput } }}
              className={classes.querySequence}
              id="query-sequence-id"
              name="querySequenceId"
              label="Sequence ID"
              placeholder="Add a name/id for your sequence"
              helperText={querySequenceIdError ? querySequenceIdError : "Add a name/id for your sequence"}
              value={querySequenceId}
              error={querySequenceIdError ? true : false}
              onChange={this._handleChange}
              required
              fullWidth
            />
          </FormControl>
          <FormControl fullWidth>
            <TextField
              InputProps={{ classes: { input: classes.querySequenceInput } }}
              className={classes.querySequence}
              id="query-sequence"
              name="querySequence"
              label="Query Protein Sequence"
              placeholder="Paste your protein sequence here"
              helperText={querySequenceError ? querySequenceError : "Protein sequence should be a string of amino-acids"}
              multiline
              autoFocus
              fullWidth
              value={querySequence}
              error={querySequenceError ? true : false}
              onChange={this._handleChange}
              required
            />
          </FormControl>
        </div>
        <div className={classes.section}>
          <CardActions className={classes.buttonBar}>
            {locked ? (
              <Fab variant="extended" color="secondary"
                onClick={this._handleSubmit}><CreateIcon className={classes.extendedIcon} />Edit</Fab>
            ) : (
                <Fab disabled={isValid ? false : true} variant="extended" color="primary"
                  onClick={this._handleSubmit}><PlayArrowIcon className={classes.extendedIcon} />{submitLabel}</Fab>
              )}
          </CardActions>
        </div>
        {!locked && (
          <div className={classes.section}>
            <CardActions className={classes.buttonBar}>
              <Button variant="contained" color="secondary" size="small"
                onClick={this._handleClear}>Clear
              </Button>
              <ButtonGroup size="small">
                <Button variant="contained" size="small"
                  onClick={() => this._handleExampleClick("A0A0Q0Y989")}
                  className={classes.exampleButton}>Example Query 1</Button>
                <Button variant="contained" size="small"
                  onClick={() => this._handleExampleClick("O014992")}
                  className={classes.exampleButton}>Example Query 2</Button>
                <Button variant="contained" size="small"
                  onClick={() => this._handleExampleResultClick()}
                  className={classes.exampleButton}>Example Response 1</Button>
              </ButtonGroup>
            </CardActions>
          </div>)}
      </div >);
  }
}

QuerySequenceStep.propTypes = {
  classes: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onMockResult: PropTypes.func.isRequired,
  onUnlock: PropTypes.func,
  queryId: PropTypes.string,
  querySequence: PropTypes.string,
  submitLabel: PropTypes.string,
  locked: PropTypes.bool,
};

export default withStyles(styles)(QuerySequenceStep);

