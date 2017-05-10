var enrichUtils = {
  /**
   * Versions the localStorage object, lets us flush old data if there are updates or fixes
   */
  storeVersion: 1,
  /**
  * @param {String} formName
  * @param {function} handleSuccess
  * @param {function} handleFail
  */
  createLead: function(opts) {
    /*
    formName        CSS selector of the form
    handleSuccess   success of the ajax post
    handleFail      fail of the ajax post
    isMatch         if it is a clearbit match
    */
    var theForm = $(opts.formName);
    var clearbitFieldAssociation = enrichUtils.clearbitAssociation(theForm);

    // We've got all the stuff we need to create/enrich a lead, lets store it for future use
    enrichUtils.storeLead(theForm, clearbitFieldAssociation, opts.isMatch);

    // Send off the data to become a lead
    enrichUtils.postLead(theForm.serialize(), clearbitFieldAssociation, opts.handleSuccess, opts.handleFail);
  },

  /**
   * @param {object} theForm jQuery object of the form
   * @returns {object}  Key/value pair of form field names and their clearbit addresses
   */
  clearbitAssociation: function(theForm) {
    var clearbitFieldAssociation = {};

    theForm.find("[data-clearbit]").each(function(i,ele) {
      clearbitFieldAssociation[$(ele).attr('name')] = $(ele).attr('data-clearbit');
    });
    return clearbitFieldAssociation;
  },

  /**
   * postLead: Does the actual posting of the lead data
   * @param {String} theForm Serialized form data
   * @param {object} clearbitFieldAssociation clearbit/form field mapping object
   * @param {function} handleSuccess function for success callback
   * @param {function} handleFail function for fail callback
   */
  postLead: function(theForm, clearbitFieldAssociation, handleSuccess, handleFail) {
    var clearbitFieldURI = "&clearbitFieldAssociation="+JSON.stringify(clearbitFieldAssociation);
    $.post('/app/v2/lead', theForm + clearbitFieldURI) // serialize form and post to lead creation endpoint
      .fail(function(){
        if (handleFail) handleFail();
      })
      .success(function(data){
        if (handleSuccess) handleSuccess(data);
      });
  },


  /**
   * leadFromStorage: automatically create a lead with stored data that we know will enrich
   * @param {object} opts          configuration for creating a lead from localstorage
   *
   * @return nothing
   */
  leadFromStorage: function(opts) {
    /*
      formSelector  CSS selector for the normal submission form
      preFire       any params or things to run prior to automatically creating the lead
      success       success callback when a lead is created
      fail          if creating a lead fails
      notStored     if no data is found in storage, a function that can show form fields or whatever
    */
    var theForm = $(opts.formSelector);
    if (theForm.length) {
      if (opts.preFire) opts.preFire();

      var enrichedFormData = localStorage.getItem("enrichedFormData");
      if (enrichedFormData) {
        var enrichedFormName = $(opts.formSelector).attr("data-enriched-page");
        enrichedFormData = JSON.parse(enrichedFormData);

        // If the stored version is old, destroy the localStorage
        if (enrichedFormData.version !== enrichUtils.storeVersion) {
          localStorage.removeItem("enrichedFormData");
          opts.notStored();
          return;
        }

        // I think the clearbit association can behave like a signature of the possible form fields
        // we need to fill out, so we can quickly check if the stored info fields will match the page fields
        // That way, if future forms have new fields, we can make sure they are not bypassed
        var checkAssociation = enrichUtils.clearbitAssociation($(opts.formSelector));
        if ( JSON.stringify(checkAssociation) != JSON.stringify(enrichedFormData.fieldAssociation)) {
          opts.notStored();
          return;
        }
        enrichedFormData.visitedForms[enrichedFormName] = true;
        localStorage.setItem("enrichedFormData", JSON.stringify(enrichedFormData));

        enrichUtils.postLead(
          enrichedFormData.formData + "&" + $(opts.formSelector).find("[type='hidden']").serialize(),
          enrichedFormData.fieldAssociation, opts.success, opts.fail);

      } else {
        opts.notStored();
      }
    }

  },

  /**
   * storeLead: Store entered information that we can use to automatically enrich their lead
   * @param {String} formSelector                 CSS selector of the form we will automatically create a lead for
   * @param {Object} clearbitFieldAssociation     Key/value pair that matches form field name to
   * @returns nothing
   */
  storeLead: function(theForm, clearbitFieldAssociation, isMatch) {
    if (localStorage && !localStorage.getItem("enrichedFormData")) {
      // no data stored, store enriched data

      var enrichedFormName = theForm.attr("data-enriched-page");
      var enrichedFormData = {
        formData:theForm.find(".required, .enrichment-required").serialize(),
        "fieldAssociation":clearbitFieldAssociation,
        visitedForms: {},
        version: enrichUtils.storeVersion,
        isMatch: isMatch
      };
      enrichedFormData.visitedForms[enrichedFormName] = true;
      localStorage.setItem("enrichedFormData", JSON.stringify(enrichedFormData));
    }
  }
};
