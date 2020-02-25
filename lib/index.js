const WDIOReporter = require('@wdio/reporter').default;

const Handlebars = require('handlebars');
const fs = require('fs-extra');
const _ = require('lodash');
const path = require('path');
const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');

momentDurationFormatSetup(moment);
const escapeStringRegexp = require('escape-string-regexp');
const Png = require('pngjs').PNG;
const Jpeg = require('jpeg-js');


class HtmlReporter extends WDIOReporter {
  constructor(options) {
    super(options);
    this.options = options;
    // this.config = config;

    this.runningSuites = [];
    this.stats = {};

    this.on('complete', (test) => {
      console.log('=====> COMPLETED');
    });

    this.on('client:onComplete', (test) => {
      console.log('>>>>> COMPLETED');
    });
  }

  onRunnerStart(runner) {
    this.runningSuites.push(runner.cid);
  }

  onSuiteStart(suite) {
    // this.suiteUids.push(suite.uid);
  }

  onSuiteEnd(suite) {
    // this.suites.push(suite);
  }

  onHookEnd(hook) {
    // if (hook.error) {
    //   this.stateCounts.failed++;
    // }
  }

  // onTestPass(test) {
  //   // console.log(`test: ${JSON.stringify(test, null, 2)}`);
  //   this.results[test.cid].passing++;
  //   // this.stateCounts.passed++;
  // }

  // onTestFail(test) {
  //   // this.stateCounts.failed++;
  //   this.results[test.cid].failing++;
  // }

  // onTestSkip(test) {
  //   // this.stateCounts.skipped++;
  //   this.results[test.cid].pending++;
  // }

  // this.on('job:start', (job) => {
  //   console.log(`==> job:start!!`);
  // });

  onRunnerEnd(runner) {
    // console.log(JSON.stringify(runner, null, 2));
    // console.log(JSON.stringify(this.specs, null, 2));
    // console.log(JSON.stringify(this.suites, null, 2));
    // this.htmlOutput();
    
    console.log(`currentSuites: ${this.currentSuites.length}`);

    _.remove(this.runningSuites, (e) => {
      return e === runner.cid;
    });

    console.log(`ending ${runner.cid}: ${JSON.stringify(this.runningSuites)}`);


    if (this.runningSuites.length === 0) {
      console.log(JSON.stringify(this.stats));
      this.stats.end = this.currentSuites[this.currentSuites.length -1].end;
      debugger;  
    }
    if (!this.stats.start) {
      this.stats.start = this.currentSuites[0].start;
    }
  }


  // this.on('runner:start', (runner) => {
  //   this.specs[runner.cid] = runner.specs;
  //   this.results[runner.cid] = {
  //     passing: 0,
  //     pending: 0,
  //     failing: 0,
  //   };
  // });

  // this.on('suite:start', (suite) => {});

  // this.on('test:pending', (test) => {
  //   this.results[test.cid].pending++;
  // });

  // this.on('test:pass', (test) => {
  //   this.results[test.cid].passing++;
  // });

  //   this.on('runner:screenshot', (runner) => {
  //     // if the filename isn't defined, it cannot find the file and cannot be added to the report
  //     if (!runner.filename) {
  //       return;
  //     }
  //     const { cid } = runner;
  //     const { stats } = this.baseReporter;
  //     const results = stats.runners[cid];
  //     const specHash = stats.getSpecHash(runner);
  //     const spec = results.specs[specHash];
  //     const lastKey = Object.keys(spec.suites)[Object.keys(spec.suites).length - 1];
  //     const currentTestKey = Object.keys(spec.suites[lastKey].tests)[Object.keys(spec.suites[lastKey].tests).length - 1];
  //     spec.suites[lastKey].tests[currentTestKey].screenshots.push(runner.filename);
  //   });

  //   this.on('screenshot:fullpage', (data) => {
  //     // if the filename isn't defined, it cannot find the file and cannot be added to the report
  //     if (!data.filename) {
  //       return;
  //     }
  //     const { cid } = data;
  //     const { stats } = this.baseReporter;
  //     const results = stats.runners[cid];
  //     const specHash = Object.keys(results.specs)[Object.keys(results.specs).length - 1];
  //     const spec = results.specs[specHash];
  //     const lastKey = Object.keys(spec.suites)[Object.keys(spec.suites).length - 1];
  //     const currentTestKey = Object.keys(spec.suites[lastKey].tests)[Object.keys(spec.suites[lastKey].tests).length - 1];
  //     spec.suites[lastKey].tests[currentTestKey].screenshots.push(data.filename);
  //   });

  //   this.on('test:fail', (test) => {
  //     this.results[test.cid].failing++;
  //   });

  //   this.on('suite:end', (suite) => {});

  //   this.on('runner:end', (runner) => {
  //     this.htmlOutput();
  //   });



  //   this.on('runner:logit', (data) => {
  //     const { stats } = this.baseReporter;
  //     const results = stats.runners[data.cid];
  //     const specHash = Object.keys(results.specs)[Object.keys(results.specs).length - 1];
  //     const spec = results.specs[specHash];
  //     const lastKey = Object.keys(spec.suites)[Object.keys(spec.suites).length - 1];
  //     const currentTestKey = Object.keys(spec.suites[lastKey].tests)[Object.keys(spec.suites[lastKey].tests).length - 1];

  //     if (spec.suites[lastKey].tests[currentTestKey].logit == null) {
  //       spec.suites[lastKey].tests[currentTestKey].logit = [];
  //     }
  //     spec.suites[lastKey].tests[currentTestKey].logit.push(data.output);
  //   });
  // }

  htmlOutput() {
    const source = fs.readFileSync(path.resolve(__dirname, '../lib/wdio-html-reporter-template.hbs'), 'utf8');

    Handlebars.registerHelper('imageAsBase64', (screenshotFile, screenshotPath, options) => {
      // occurs when there is an error file
      if (!fs.existsSync(screenshotFile)) {
        screenshotFile = `${screenshotPath}/${screenshotFile}`;
      }
      const png = new Png.sync.read(fs.readFileSync(path.resolve(`${screenshotFile}`)));
      return `data:image/jpeg;base64,${Jpeg.encode(png, 50).data.toString('base64')}`;
    });

    Handlebars.registerHelper('isValidSuite', function (suite, options) {
      if (suite.title.length > 0 && suite.uid.match(new RegExp(escapeStringRegexp(suite.title)))) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    Handlebars.registerHelper('testStateColour', (state, options) => {
      if (state === 'pass') {
        return 'test-pass';
      } if (state === 'fail') {
        return 'test-fail';
      } if (state === 'pending') {
        return 'test-pending';
      }
    });

    Handlebars.registerHelper('suiteStateColour', (tests, options) => {
      const numTests = Object.keys(tests).length;

      const fail = _.values(tests).find((test) => test.state === 'fail');
      if (fail != null) {
        return 'suite-fail';
      }

      const pending = _.values(tests).find((test) => test.state === 'pending');
      if (pending != null) {
        return 'suite-pending';
      }

      const passes = _.values(tests).filter((test) => test.state === 'pass');
      if (passes.length === numTests && numTests > 0) {
        return 'suite-pass';
      }
      return 'suite-unknown';
    });

    Handlebars.registerHelper('humanizeDuration', (duration, options) => moment.duration(duration, 'milliseconds').format('hh:mm:ss.SS', { trim: false }));

    Handlebars.registerHelper('ifSuiteHasTests', function (testsHash, options) {
      if (Object.keys(testsHash).length > 0) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    const template = Handlebars.compile(source);

    // this.stats.duration = 
    // console.log(JSON.stringify(suites, null, 2));
    const data = { stats: suites };
    console.log(`data.stats._duration: ${data.stats._duration}`);
    console.log(JSON.stringify(data, null, 2));
    const result = template(data);

    // if (this.config.reporterOptions && this.config.reporterOptions.htmlFormat && this.config.reporterOptions.htmlFormat.outputDir) {
    //   if (fs.pathExistsSync(this.config.reporterOptions.htmlFormat.outputDir)) {
    //     const reportfile = `${this.config.reporterOptions.htmlFormat.outputDir}/wdio-report.html`;
    //     console.log(`View WDIO HTML Report at: ${reportfile}`);
    //     fs.outputFileSync(reportfile, result);
    //     return;
    //   }
    // }
    console.log('View WDIO HTML Report at: ./wdio-report.html');
    fs.outputFileSync('./wdio-report.html', result);
  }

  getOrderedSuites() {
    if (this.orderedSuites) {
      return this.orderedSuites;
    }

    this.orderedSuites = [];
    for (const uid of this.suiteUids) {
      for (const suite of this.suites) {
        if (suite.uid !== uid) {
          continue;
        }
        this.orderedSuites.push(suite);
      }
    }

    return this.orderedSuites;
  }
}
exports.default = HtmlReporter;
