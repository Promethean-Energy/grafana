import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react';
import { locationService, setDataSourceSrv } from '@grafana/runtime';

import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';
import { fetchAlertManagerConfig, updateAlertManagerConfig } from './api/alertmanager';
import { typeAsJestMock } from 'test/helpers/typeAsJestMock';
import { configureStore } from 'app/store/configureStore';

import { mockDataSource, MockDataSourceSrv } from './mocks';
import { DataSourceType } from './utils/datasource';
import { AlertManagerCortexConfig, MuteTimeInterval } from 'app/plugins/datasource/alertmanager/types';
import { byRole, byTestId, byText } from 'testing-library-selector';
import userEvent from '@testing-library/user-event';
import MuteTimings from './MuteTimings';

jest.mock('./api/alertmanager');

const mocks = {
  api: {
    fetchAlertManagerConfig: typeAsJestMock(fetchAlertManagerConfig),
    updateAlertManagerConfig: typeAsJestMock(updateAlertManagerConfig),
  },
};

const renderMuteTimings = (location = '/alerting/routes/mute-timing/new') => {
  const store = configureStore();
  locationService.push(location);

  return render(
    <Provider store={store}>
      <Router history={locationService.getHistory()}>
        <MuteTimings />
      </Router>
    </Provider>
  );
};

const dataSources = {
  am: mockDataSource({
    name: 'Alertmanager',
    type: DataSourceType.Alertmanager,
  }),
};

const ui = {
  form: byTestId('mute-timing-form'),
  nameField: byTestId('mute-timing-name'),

  startsAt: byTestId('mute-timing-starts-at'),
  endsAt: byTestId('mute-timing-ends-at'),
  addTimeRange: byRole('button', { name: /add another time range/i }),

  weekdays: byTestId('mute-timing-weekdays'),
  days: byTestId('mute-timing-days'),
  months: byTestId('mute-timing-months'),
  years: byTestId('mute-timing-years'),

  addInterval: byRole('button', { name: /add another time interval/i }),
  submitButton: byText(/submit/i),
};

describe('Mute timings', () => {
  const muteTimeInterval: MuteTimeInterval = {
    name: 'default-mute',
    time_intervals: [
      {
        times: [
          {
            start_time: '12:00',
            end_time: '24:00',
          },
        ],
        days_of_month: ['15', '-1'],
        months: ['august:december', 'march'],
      },
    ],
  };
  const defaultConfig: AlertManagerCortexConfig = {
    alertmanager_config: {
      receivers: [{ name: 'default' }, { name: 'critical' }],
      route: {
        receiver: 'default',
        group_by: ['alertname'],
        routes: [
          {
            matchers: ['env=prod', 'region!=EU'],
            mute_time_intervals: [muteTimeInterval.name],
          },
        ],
      },
      templates: [],
      mute_time_intervals: [muteTimeInterval],
    },
    template_files: {},
  };

  mocks.api.fetchAlertManagerConfig.mockImplementation(() => {
    return Promise.resolve(defaultConfig);
  });
  mocks.api.updateAlertManagerConfig.mockImplementation(() => {
    return Promise.resolve();
  });

  beforeEach(() => {
    setDataSourceSrv(new MockDataSourceSrv(dataSources));
  });

  it('creates a new mute timing', async () => {
    await renderMuteTimings();

    await waitFor(() => expect(mocks.api.fetchAlertManagerConfig).toHaveBeenCalled());
    expect(ui.nameField.get()).toBeInTheDocument();

    userEvent.type(ui.nameField.get(), 'maintenance period');
    userEvent.type(ui.startsAt.get(), '22:00');
    userEvent.type(ui.endsAt.get(), '24:00');
    userEvent.type(ui.days.get(), '-1');
    userEvent.type(ui.months.get(), 'january, july');

    fireEvent.submit(ui.form.get());

    await waitFor(() => expect(mocks.api.updateAlertManagerConfig).toHaveBeenCalled());
    expect(mocks.api.updateAlertManagerConfig).toHaveBeenCalledWith('grafana', {
      ...defaultConfig,
      alertmanager_config: {
        ...defaultConfig.alertmanager_config,
        mute_time_intervals: [
          muteTimeInterval,
          {
            name: 'maintenance period',
            time_intervals: [
              {
                days_of_month: ['-1'],
                months: ['january', 'july'],
                times: [
                  {
                    start_time: '22:00',
                    end_time: '24:00',
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  });

  it('prepoluates the form when editing a mute timing', async () => {
    await renderMuteTimings(
      '/alerting/routes/mute-timing/edit' + `?muteName=${encodeURIComponent(muteTimeInterval.name)}`
    );

    await waitFor(() => expect(mocks.api.fetchAlertManagerConfig).toHaveBeenCalled());
    expect(ui.nameField.get()).toBeInTheDocument();
    expect(ui.nameField.get()).toHaveValue(muteTimeInterval.name);
    expect(ui.months.get()).toHaveValue(muteTimeInterval.time_intervals[0].months?.join(', '));
  });
});
