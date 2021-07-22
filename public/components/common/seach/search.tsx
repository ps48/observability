/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  EuiFlexGroup,
  EuiButton,
  EuiFlexItem,
} from '@elastic/eui';
import _ from 'lodash';

import { QueryBar } from './queryBar';
import { Filter } from './Filter';

import './search.scss';
import { _termValuesToQuery } from '@elastic/eui/src/components/search_bar/query/ast_to_es_query_dsl';
import {autocomplete} from '@algolia/autocomplete-js'
import '@algolia/autocomplete-theme-classic'
import {Autocomplete, getSuggestions} from './autocomplete'
import {
  RAW_QUERY
} from '../../../common/constants/explorer';

export interface IQueryBarProps {
  query: string
  handleQueryChange: (query: string) => void;
  handleQuerySearch: () => void
}

export interface IFilterProps {
  startTime: String
  endTime: String
  setStartTime: () => void
  setEndTime: () => void
  setTimeRange: () => void
  setIsOutputStale: () => void
}

export const Search = (props: any) => {

  const {
    query,
    handleQueryChange,
    handleQuerySearch,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    setIsOutputStale,
    actionItems
  } = props;

  function renderAutocomplete ({ query, handleQueryChange, handleQuerySearch }: IQueryBarProps) {
    return (
      <Autocomplete
        query = { query }
        handleQueryChange = { handleQueryChange }
        handleQuerySearch = { handleQuerySearch }
      />
    )
  }

  return (
    <div className="globalQueryBar">
      <EuiFlexGroup
          gutterSize="s"
          justifyContent="flexEnd"
        >
          <div className="autocomplete">
          { renderAutocomplete({ query, handleQueryChange, handleQuerySearch }) }
          </div>
          <Filter
            startTime={ startTime }
            endTime={ endTime }
            setStartTime={ setStartTime }
            setEndTime={ setEndTime }
            setIsOutputStale={ setIsOutputStale }
            liveStreamChecked={props.liveStreamChecked}
            onLiveStreamChange={props.onLiveStreamChange}
          />
          { actionItems.length > 0 && (
            actionItems.map((item) => {
              return (
                <EuiFlexItem
                  className={ item.className ? item.className : "euiFlexItem--flexGrowZero"}
                >
                  <EuiButton 
                    iconType={ item.iconType }
                    { ...item.attributes }
                    { ...item.handlers }
                  >
                    { item.text }
                  </EuiButton>
                </EuiFlexItem>
              );
            })
          ) }
      </EuiFlexGroup>
    </div>
  );
}

Search.propTypes = {
  handleQueryChange: PropTypes.func,
  handleQuerySearch: PropTypes.func
};