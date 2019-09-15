import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import StepContent from "@material-ui/core/StepContent";
import Button from "@material-ui/core/Button";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import CardActions from "@material-ui/core/CardActions";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import QuerySequenceStep from "./QuerySequenceStep.js";
import FunfamMatchList from "./FunfamMatchList.js";
import ModelStructure from "./ModelStructure.js";
import SubmitCheckResultProvider from "./SubmitCheckResultProvider.js";

import { parseCathScanResponseData } from "../models/SearchScan.js";

const STEP_QUERY = 0, STEP_TEMPLATE = 1, STEP_MODEL = 2;

const styles = theme => ({
  root: {
    width: "100%",
  },
  stepContent: {
    padding: theme.spacing(1),
  },
  button: {
    marginTop: theme.spacing(1),
    marginRight: theme.spacing(1),
  },
  actionsContainer: {
    marginBottom: theme.spacing(1)
  },
  resetContainer: {
    padding: theme.spacing(1)
  },
  extensionPanel: {
    width: '100%',
  },
  fullwidth: {
    width: '100%',
  },
  transparent: {
    backgroundColor: 'transparent',
  }
});

const STEPS_CONFIG = [
  {
    id: "query-sequence",
    label: "Query Sequence",
    dataClass: "QuerySequence"
  },
  {
    id: "select-template",
    label: "Select Template",
    resultClass: "SelectTemplateTable",
    providerClass: "SubmitCheckResultProvider",
    providerProps: {
      apiBase: "https://api01.cathdb.info/",
      authTokenEndpoint: "api/api-token-auth/",
      submitEndpoint: "api/select-template/",
      checkEndpoint: "api/select-template/<id>/",
      resultEndpoint: "api/select-template/<id>/results",
      taskIdFromSubmit: data => {
        return data["uuid"];
      },
      isCompleteFromCheck: data => {
        return data["status"] === "success";
      },
      isErrorFromCheck: data => {
        const msg = data["message"];
        return data["status"] === "error" ? msg : false;
      },
      username: "apiuser",
      password: "apiuserpassword"
    },
    providerHandles: {
      onError: "handleTemplateError",
      onSubmitResponse: "handleTemplateSubmit",
      onCheckResponse: "handleTemplateCheck",
      onResultResponse: "handleTemplateResult"
    }
  },
  {
    id: "model-structure",
    label: "Model Structure",
    resultClass: "ModelStructure",
    providerClass: "SubmitCheckResultProvider",
    providerProps: {
      apiBase: "http://beta.swissmodel.expasy.org/",
      authTokenEndpoint: "api/api-auth-token/",
      submitEndpoint: "api/alignment/",
      checkEndpoint: "api/alignment/<id>/status",
      resultEndpoint: "api/alignment/<id>/",
      taskIdFromSubmit: data => {
        return data["uuid"];
      },
      isCompleteFromCheck: data => {
        return data["status"] === "success";
      },
      isErrorFromCheck: data => {
        return data["status"] === "error";
      },
      username: "ian",
      password: "4cathuse"
    },
    providerHandles: {
      onError: "handleModelError",
      onSubmitResponse: "handleModelSubmit",
      onCheckResponse: "handleModelCheck",
      onResultResponse: "handleModelResult"
    }
  }
];

// error
// {queryId, querySequence}: false => step1
// {queryId, querySequence}: true  => step1 complete

class WorkFlow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeStep: STEP_QUERY,
      queryId: null,
      querySequence: null,
      querySequenceLocked: false,
      templates: null,
      templateTaskId: null,
      hits: null,
      templateHitId: null,
      hitResult: null,
      templateModelId: null,
      modelResult: null,
      templateError: null,
      templateScanResult: null,
    };

    this.handleSubmitSequence = this.handleSubmitSequence.bind(this);

    this.handleTemplateError = this.handleTemplateError.bind(this);
    this.handleTemplateSubmit = this.handleTemplateSubmit.bind(this);
    this.handleTemplateCheck = this.handleTemplateCheck.bind(this);
    this.handleTemplateResult = this.handleTemplateResult.bind(this);

    this.handleExampleScanResults = this.handleExampleScanResults.bind(this);

    this.handleChangeStep = this.handleChangeStep.bind(this);

    // this.handleModelError = this.handleModelError.bind(this);
    // this.handleModelSubmit = this.handleModelSubmit.bind(this);
    // this.handleModelCheck = this.handleModelCheck.bind(this);
    // this.handleModelResult = this.handleModelResult.bind(this);
  }

  handleNext = e => {
    console.log("handleNext: ", e, e.target);
    this.setState(state => ({
      activeStep: state.activeStep + 1
    }));
  };

  handleBack = () => {
    this.setState(state => ({
      activeStep: state.activeStep - 1
    }));
  };

  handleReset = () => {
    this.setState({
      activeStep: 0
    });
  };

  renderQuerySequence() {
    const { classes } = this.props;
    const { queryId, querySequence, querySequenceLocked, templateScanResult } = this.state;

    const dataProps = STEPS_CONFIG[STEP_TEMPLATE].providerProps;
    const templateSubmitData = {
      query_id: queryId,
      query_sequence: querySequence
    };

    return (
      <div className={classes.fullwidth}>
        <QuerySequenceStep
          queryId={queryId}
          querySequence={querySequence}
          onSubmit={this.handleSubmitSequence}
          onMockResult={this.handleExampleScanResults}
          onUnlock={this.handleUnlockSequence}
          submitLabel={templateScanResult ? "Complete" : "Search"}
        />
        {(querySequenceLocked && !templateScanResult) && (
          <SubmitCheckResultProvider
            {...dataProps}
            submitData={templateSubmitData}
            onError={this.handleTemplateError}
            onSubmitResponse={this.handleTemplateSubmit}
            onCheckResponse={this.handleTemplateCheck}
            onResultResponse={this.handleTemplateResult}
          />)}
      </div>
    );
  }

  handleSubmitSequence(ev, seq) {
    console.log("Setting sequence: ", seq);
    const queryId = seq.id;
    const querySequence = seq.seq;
    this.setState(state => {
      return {
        activeStep: STEP_TEMPLATE,
        queryId: queryId,
        querySequence: querySequence,
        querySequenceLocked: true,
        templateTaskId: null,
        hits: null,
        templateHitId: null,
        hitResult: null,
        templateModelId: null,
        modelResult: null,
      };
    });
  }

  handleChangeStep(step) {
    this.setState({ activeStep: step });
  }

  handleUnlockSequence(ev, seq) {
    const queryId = seq.id;
    const querySequence = seq.seq;
    this.setState(state => {
      return {
        querySequenceLocked: false,
      };
    });
  }

  getStepConfigById(stepid) {
    return STEPS_CONFIG.find(data => data.id === stepid);
  }

  handleTemplateError(msg) {
    console.log("handleTemplateError", msg);
    this.setState({ templateError: true });
  }

  handleTemplateSubmit(data) {
    this.setState({ querySequenceLocked: true });
    console.log("handleTemplateSubmit", data);
  }

  handleTemplateCheck(data) {
    console.log("handleTemplateCheck", data);
  }

  handleTemplateResult(rawdata) {
    console.log("handleTemplateResult", this, rawdata);
    const scan = this.parseTemplateResultData(rawdata);
    if (scan.results.length > 1) {
      throw Error(
        `Scan has ${scan.results.length} results, expected exactly 1`
      );
    }
    const scanResult = scan.results[0];
    const hits = scanResult ? scanResult.hits : undefined;
    this.setState(state => {
      return {
        activeStep: STEP_TEMPLATE,
        querySequenceLocked: true,
        templateTaskId: null,
        hits: null,
        templateScanResult: scanResult
      }
    });
  }

  handleExampleScanResults(queryId, querySequence, responseData) {
    console.log("handleExampleScanResults.queryId", queryId);
    console.log("handleExampleScanResults.querySequence", querySequence);
    console.log("handleExampleScanResults.responseData", responseData);
    const scan = this.parseTemplateResultData(responseData);
    const scanResult = scan.results[0];
    this.setState({
      activeStep: STEP_TEMPLATE,
      queryId: queryId,
      querySequence: querySequence,
      templateScanResult: scanResult,
    });
  }

  parseTemplateResultData(rawdata) {
    console.log("parseTemplateResultData", rawdata);
    const results_json = rawdata.results_json;
    const data = JSON.parse(results_json);
    let scan = null;
    try {
      scan = parseCathScanResponseData(data);
    } catch (e) {
      console.log("failed to parse template results from data", e, rawdata);
      this.handleTemplateError("failed to parse template results from data");
    }
    return scan;
  }

  renderSelectTemplate() {
    const stepConfig = this.getStepConfigById("select-template");

    const { queryId, querySequence, templateScanResult } = this.state;

    return (
      <div>
        {queryId ? (
          <FunfamMatchList
            queryId={queryId}
            querySequence={querySequence}
            scanResult={templateScanResult}
          />) : <div />}
      </div>
    );
  }

  renderModelStructure() {
    return <ModelStructure />;
  }

  render() {
    const { classes } = this.props;
    const { activeStep, queryId } = this.state;
    const steps = [
      { label: "Submit Sequence", renderer: this.renderQuerySequence },
      { label: "Select Template", renderer: this.renderSelectTemplate },
      { label: "Model Structure", renderer: this.renderModelStructure },
    ];

    console.log("WorkFlow.render", this.state)
    const templateScanResults = this.state.templateScanResult;
    const templateHits = templateScanResults ? templateScanResults.hits : [];
    const templatePdbHits = templateHits.filter(hit => hit.repSourceId === 'cath');

    const stepContent = steps[activeStep].renderer.bind(this)();

    return (
      <div className={classes.root}>
        <div>
          <Stepper classes={{ root: classes.transparent }} activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => {
              const label = step["label"];
              return (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </div>

        <ExpansionPanel
          expanded={activeStep === STEP_QUERY}
          onChange={() => this.handleChangeStep(STEP_QUERY)}
        >
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel-sequence-content"
            id="panel-sequence-header"
          >
            {queryId ? (
              <span>Query Sequence: <strong>&quot;{queryId}&quot;</strong></span>
            ) : "Select Query Sequence"}
          </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.extensionPanel}>
            {this.renderQuerySequence()}
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel
          expanded={activeStep === STEP_TEMPLATE}
          onChange={() => this.handleChangeStep(STEP_TEMPLATE)}
        >
          <ExpansionPanelSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel-template-content"
            id="panel-template-header"
          >
            Found {templatePdbHits.length} hits with template PDB structures ({templateHits.length} hits in total)
              </ExpansionPanelSummary>
          <ExpansionPanelDetails className={classes.extensionPanel}>
            {this.renderSelectTemplate()}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div >
    );
  }
}

WorkFlow.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(WorkFlow);
