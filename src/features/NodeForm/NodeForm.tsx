import React, { PureComponent } from 'react';
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { addNewBlankRecordForm, selectTableAppCols, RecordOfAnyType } from '../../model/ModelSlice';
import { updateRecord, insertRecord, deleteRecord } from '../../model/ModelThunks';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../rootReducer'; 
import { AppField } from './FieldFactory';  
import { recordDelta, properCase } from '../../utils/utils';

export interface NodeFormProps {
  navTable   : string, 
  navTableID : string, 
  record     : RecordOfAnyType
}

export const NodeForm = (
    props : NodeFormProps) => {
  const { navTable, navTableID, record } = props;
  const rootState = useSelector<RootState,RootState>(state=>state);

  console.log('NodeForm');

  if (!navTable)      
    return <></>;
  else if (!navTableID)    
    return <AddNewFormButton navTable = {navTable} />
  else
    return <AutoForm 
      navTable   = { navTable } 
      navTableID = { navTableID } 
      rootState  = { rootState }
      record     = { record } />;
}

interface AutoFormProps extends NodeFormProps {
  rootState  : RootState
}

class AutoForm extends PureComponent<AutoFormProps, AutoFormProps> 
{
  // TODO: Of course, later, I'll want to add dirty-field protection to confirm loss of table / 
  //       record ID focus to avoid losing edits in progress, etc...  And this may come 
  //       along as a feature with more sophisticated state management overall and moving
  //       form redux-thunk to redux-saga...

  // Shallow copy as opposed to straight assignment used and prevents React 16.5+ warning
  // (Same case and remedy as described here: https://github.com/mobxjs/mobx-react/issues/545)
  state = { ...this.props }; 

  static getDerivedStateFromProps(
            nextProps: AutoFormProps, 
            prevState: AutoFormProps) 
  {
    if ( nextProps.navTable !== prevState.navTable 
        || nextProps.navTableID !== prevState.navTableID )
      return nextProps;
    else
      return null;
  }

  render() {
    const { navTable, navTableID, rootState } = this.props;
    const { record } = this.state;
    console.log('AutoForm');
    return <>
        <h2 style={{width:"100%"}}>{ properCase(navTable) } Record </h2>
        { 
          selectTableAppCols(rootState,navTable)
            .filter((appCol:any) => !appCol.AppColumn_ui_hidden)
            .map((appCol:any) => {
              const fieldName = appCol.AppColumn_column_name;
              return (
                <span  
                    id = { 'AppField_'+fieldName } // useful reference for unit tests
                    key = { fieldName } > 
                  <AppField                      
                    fieldName = { fieldName } 
                    field     = { record[fieldName] } 
                    rootState = { rootState }
                    onChange  = { newVal => this.setState({
                      ...this.state,
                      record: {...record, [fieldName]: newVal }
                    }) } /> 
                </span>
              )
            })
        }
        <CrudButtons 
          navTable    = { navTable } 
          navTableID  = { navTableID }
          propRecord  = { this.props.record } 
          stateRecord = { record }/> 
    </>;
  }
} 

const CrudButtons = (props:{navTable:string, navTableID:string, propRecord:any, stateRecord:any}) => {
      // Do not use memo() here since we must have a reference to the latest Mutators with latest NavTableID, etc. closure data
  const {navTable, navTableID, propRecord, stateRecord} = props;
  console.log('CrudButtons');
  const dispatch = useDispatch();
  return (
    <Container maxWidth="xl">
      <Typography component="div" style={{ paddingTop: '50px', textAlign: 'left' }}>
        <Button
          id="crudSave" 
          variant='contained' 
          onClick={ (e) => { 
            if (navTableID==="-1") 
              dispatch(insertRecord(navTable,stateRecord))
            else
              dispatch(updateRecord(navTable,navTableID,recordDelta(stateRecord, propRecord)))
        }}>
          Save
        </Button> 
        <span style={{minWidth: 20, display: 'inline-block'}}></span>
        <Button 
          id="crudDelete" 
          variant='contained' 
          onClick={ (e) => { 
            dispatch(deleteRecord(navTable,navTableID));
          }}>
          Delete
        </Button>
        <span style={{minWidth: 20, display: 'inline-block'}}></span>
        <Button 
          id="crudCancel" 
          variant='contained'>
          Cancel
        </Button>
      </Typography>
    </Container>
  )
}

export const AddNewFormButton = (props:{navTable:any}) => {
    const { navTable } = props;
    console.log(`AddNewFormButton navTable="${navTable}"`);
    const dispatch = useDispatch();
    return (
        <Button variant='contained' onClick={(e)=> dispatch(addNewBlankRecordForm(navTable)) }>
          Add New { navTable }
        </Button>
    );
}
