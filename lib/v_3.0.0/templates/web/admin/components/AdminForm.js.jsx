/**
 * Reusable stateless form component for __PascalName__
 */

// import primary libraries
import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

// import form components
import { TextInput } from '../../../../global/components/forms';

const Admin__PascalName__Form = ({
  cancelLink
  , formHelpers
  , formTitle
  , formType
  , handleFormChange
  , handleFormSubmit
  , __camelName__
}) => {

  // set the button text
  const buttonText = formType === "create" ? "Create __startName__" : "Update __startName__";

  // set the form header
  const header = formTitle ? <div className="formHeader"><h2> {formTitle} </h2><hr /></div> : <div />;

  return (
    <div className="container">
      <div className="max-w-3xl mx-auto">
        <form name="__camelName__Form" className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
          {header}
          <TextInput
            change={handleFormChange}
            label="Name"
            name="__camelName__.name"
            placeholder="Name (required)"
            required={true}
            value={__camelName__.name}
          />
          <div className="flex flex-row justify-between">
            <Link className="btn-sm btn-cancel" to={cancelLink}>Cancel</Link>
            <button className="btn-sm " type="submit" > {buttonText} </button>
          </div>
        </form>
      </div>
    </div>
  )
}

Admin__PascalName__Form.propTypes = {
  cancelLink: PropTypes.string.isRequired
  , formHelpers: PropTypes.object
  , formTitle: PropTypes.string
  , formType: PropTypes.string.isRequired
  , handleFormChange: PropTypes.func.isRequired
  , handleFormSubmit: PropTypes.func.isRequired
  , __camelName__: PropTypes.object.isRequired
}

Admin__PascalName__Form.defaultProps = {
  formHelpers: {}
  , formTitle: ''
}

export default Admin__PascalName__Form;
