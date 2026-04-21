(function(window){

  // Sentry may not be loaded (blocked by ad-blocker, offline, etc.). All
  // calls go through these guards so the app keeps working regardless.
  function sentryBreadcrumb(category, message, data) {
    if (window.Sentry && typeof window.Sentry.addBreadcrumb === 'function') {
      window.Sentry.addBreadcrumb({
        category: category,
        message: message,
        level: 'info',
        data: data || {}
      });
    }
  }

  function sentryLog(level, message, attributes) {
    if (window.Sentry && window.Sentry.logger && typeof window.Sentry.logger[level] === 'function') {
      window.Sentry.logger[level](message, attributes || {});
    }
    // Always mirror to console for local debugging.
    if (typeof console !== 'undefined' && console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log']) {
      console[level === 'warn' ? 'warn' : level === 'error' ? 'error' : 'log']('[smart-app]', message, attributes || '');
    }
  }

  function sentryCapture(err, context) {
    if (window.Sentry && typeof window.Sentry.captureException === 'function') {
      if (context) {
        window.Sentry.withScope(function(scope) {
          scope.setContext('smart-app', context);
          window.Sentry.captureException(err);
        });
      } else {
        window.Sentry.captureException(err);
      }
    }
    if (typeof console !== 'undefined') {
      console.error('[smart-app]', err, context || '');
    }
  }

  // FHIR HumanName.family is string[] in DSTU2 but string in STU3/R4.
  // HumanName.given stays string[] in all versions, but defend anyway.
  function nameToString(part) {
    if (part === null || part === undefined) return '';
    if (Array.isArray(part)) return part.filter(Boolean).join(' ');
    if (typeof part === 'string') return part;
    return String(part);
  }

  function safeGet(obj, path) {
    var current = obj;
    for (var i = 0; i < path.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = current[path[i]];
    }
    return current;
  }

  window.extractData = function() {
    var ret = $.Deferred();

    function onError(err) {
      sentryCapture(err || new Error('SMART extractData failed'), {
        stage: 'onError',
        arguments: Array.prototype.slice.call(arguments).map(String)
      });
      ret.reject();
    }

    function onReady(smart) {
      sentryBreadcrumb('smart', 'FHIR.oauth2.ready resolved', {
        hasPatient: smart && smart.hasOwnProperty('patient'),
        serverUrl: safeGet(smart, ['server', 'serviceUrl'])
      });

      if (!smart || !smart.hasOwnProperty('patient')) {
        sentryLog('warn', 'No patient context on smart client');
        onError(new Error('No patient context'));
        return;
      }

      var patient = smart.patient;
      var pt, obv;

      try {
        pt = patient.read();
        obv = smart.patient.api.fetchAll({
          type: 'Observation',
          query: {
            code: {
              $or: [
                'http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                'http://loinc.org|2089-1', 'http://loinc.org|55284-4'
              ]
            }
          }
        });
      } catch (err) {
        sentryCapture(err, { stage: 'issuing-fhir-requests' });
        ret.reject();
        return;
      }

      $.when(pt, obv).fail(function() {
        var args = Array.prototype.slice.call(arguments);
        sentryCapture(new Error('FHIR request failed'), {
          stage: 'fhir-request',
          failureArgs: args.map(function(a) {
            try { return JSON.stringify(a); } catch (e) { return String(a); }
          })
        });
        ret.reject();
      });

      $.when(pt, obv).done(function(patientResource, observations) {
        try {
          sentryBreadcrumb('fhir', 'patient + observations resolved', {
            patientId: safeGet(patientResource, ['id']),
            observationCount: Array.isArray(observations) ? observations.length : 0
          });

          var byCodes = smart.byCodes(observations, 'code');

          var nameEntry = safeGet(patientResource, ['name', 0]);
          var fname = nameEntry ? nameToString(nameEntry.given) : '';
          var lname = nameEntry ? nameToString(nameEntry.family) : '';

          if (!nameEntry) {
            sentryLog('warn', 'Patient has no name entries', {
              patientId: safeGet(patientResource, ['id'])
            });
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');

          var p = defaultPatient();
          p.birthdate = safeGet(patientResource, ['birthDate']) || '';
          p.gender = safeGet(patientResource, ['gender']) || '';
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height && height[0]);

          if (systolicbp !== undefined) p.systolicbp = systolicbp;
          if (diastolicbp !== undefined) p.diastolicbp = diastolicbp;

          p.hdl = getQuantityValueAndUnit(hdl && hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl && ldl[0]);

          sentryLog('info', 'Patient data assembled', {
            patientId: safeGet(patientResource, ['id']),
            hasHeight: !!p.height,
            hasSystolic: !!p.systolicbp,
            hasDiastolic: !!p.diastolicbp,
            hasHdl: !!p.hdl,
            hasLdl: !!p.ldl
          });

          ret.resolve(p);
        } catch (err) {
          sentryCapture(err, { stage: 'unpacking-fhir-response' });
          ret.reject();
        }
      });
    }

    sentryBreadcrumb('smart', 'extractData started');
    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();
  };

  function defaultPatient() {
    return {
      fname: '',
      lname: '',
      gender: '',
      birthdate: '',
      height: '',
      systolicbp: '',
      diastolicbp: '',
      ldl: '',
      hdl: ''
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    if (!Array.isArray(BPObservations) || BPObservations.length === 0) return undefined;

    var formattedBPObservations = [];
    BPObservations.forEach(function(observation) {
      var components = safeGet(observation, ['component']);
      if (!Array.isArray(components)) return;

      var BP = components.find(function(component) {
        var codings = safeGet(component, ['code', 'coding']);
        if (!Array.isArray(codings)) return false;
        return codings.some(function(coding) { return coding && coding.code === typeOfPressure; });
      });

      if (BP && BP.valueQuantity) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
    });

    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    var value = safeGet(ob, ['valueQuantity', 'value']);
    var unit = safeGet(ob, ['valueQuantity', 'unit']);
    if (value === undefined || unit === undefined) return undefined;
    return value + ' ' + unit;
  }

  window.drawVisualization = function(p) {
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname || '');
    $('#lname').html(p.lname || '');
    $('#gender').html(p.gender || '');
    $('#birthdate').html(p.birthdate || '');
    $('#height').html(p.height || '');
    $('#systolicbp').html(p.systolicbp || '');
    $('#diastolicbp').html(p.diastolicbp || '');
    $('#ldl').html(p.ldl || '');
    $('#hdl').html(p.hdl || '');
  };

})(window);
