import React from 'react';
import ReactDOM from 'react-dom';
import { Web3ReactProvider } from '@web3-react/core';
import './index.scss';
import App from './App';
import { Provider } from 'react-redux';
import reportWebVitals from './reportWebVitals';
import { configureStore } from '@reduxjs/toolkit';
import { Web3Provider } from '@ethersproject/providers';

import Slice from './reducer'

const store = configureStore({ reducer: Slice.reducer });

require('dotenv').config();
function getLibrary(provider: any) {
	const library = new Web3Provider(provider);
	library.pollingInterval = 12000;
	return library;
}

ReactDOM.render(
	<Provider store={store}>
		<React.StrictMode>
			<Web3ReactProvider getLibrary={getLibrary}>
				<App />
			</Web3ReactProvider>
		</React.StrictMode>
	</Provider>,
	document.getElementById('root')
);

reportWebVitals();
