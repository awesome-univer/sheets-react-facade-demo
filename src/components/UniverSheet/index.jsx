
import './index.css';

import { LocaleType, Univer, UniverInstanceType } from "@univerjs/core";
import { defaultTheme } from '@univerjs/design';
import { UniverDocsPlugin } from '@univerjs/docs';
import { UniverFormulaEnginePlugin } from '@univerjs/engine-formula';
import {
  DeviceInputEventType,
  UniverRenderEnginePlugin,
} from '@univerjs/engine-render';
import {
  SelectionMoveType,
  SetSelectionsOperation,
  UniverSheetsPlugin,
} from '@univerjs/sheets';
import { UniverSheetsFormulaPlugin } from '@univerjs/sheets-formula';
import { UniverSheetsUIPlugin } from '@univerjs/sheets-ui';
import { UniverDocsUIPlugin } from '@univerjs/docs-ui';
import { UniverUIPlugin } from '@univerjs/ui';
import { FUniver } from '@univerjs/facade';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { zhCN, enUS } from 'univer:locales'

export const UniverSheet = forwardRef(({ data, onClick, onDbClick }, ref) => {
  const univerRef = useRef(null);
  const workbookRef = useRef(null);
  const containerRef = useRef(null);
  /** @type {React.RefObject<FUniver>} */
  const fUniverRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getData,
    univerAPI: fUniverRef,
  }));

  /**
   * Initialize univer instance and workbook instance
   * @param data {IWorkbookData} document see https://univer.work/api/core/interfaces/IWorkbookData.html
   */
  const init = (data = {}) => {
    if (!containerRef.current) {
      throw Error('container not initialized');
    }
    const univer = new Univer({
      theme: defaultTheme,
      locale: LocaleType.EN_US,
      locales: {
        [LocaleType.ZH_CN]: zhCN,
        [LocaleType.EN_US]: enUS,
      },
    });
    univerRef.current = univer;

    // core plugins
    univer.registerPlugin(UniverRenderEnginePlugin);
    univer.registerPlugin(UniverFormulaEnginePlugin);
    univer.registerPlugin(UniverUIPlugin, {
      container: containerRef.current,
    });

    // doc plugins
    univer.registerPlugin(UniverDocsPlugin, {
      hasScroll: false,
    });
    univer.registerPlugin(UniverDocsUIPlugin)

    // sheet plugins
    univer.registerPlugin(UniverSheetsPlugin);
    univer.registerPlugin(UniverSheetsUIPlugin);
    univer.registerPlugin(UniverSheetsFormulaPlugin);

    // create workbook instance
    workbookRef.current = univer.createUnit(UniverInstanceType.UNIVER_SHEET, data);

    // craete Facade API instance
    fUniverRef.current = FUniver.newAPI(univer);
  };

  /**
   * Destroy univer instance and workbook instance
   */
  const destroyUniver = () => {
    // univerRef.current?.dispose();
    univerRef.current = null;
    workbookRef.current = null;
  };

  /**
   * Get workbook data
   */
  const getData = () => {
    if (!workbookRef.current) {
      throw new Error('Workbook is not initialized');
    }
    return workbookRef.current.save();
  };

  useEffect(() => {
    init(data);

    let clickTime = 0;
    let dbClickTime = 0;
    const onClickDebounce = (e) => {
      // debounce click
      if (Date.now() - dbClickTime < 500) return;
      if (Date.now() - clickTime < 500) return;
      onClick(e);
      clickTime = Date.now();
    };

    fUniverRef.current.onCommandExecuted((command) => {
      if (
        command.id === SetSelectionsOperation.id &&
        command.params.type === SelectionMoveType.MOVE_END
      ) {
        // mock click event
        setTimeout(() => {
          onClickDebounce?.();
        }, 250);
      }

      // mock dbclick event
      // use command name string, because command id is not exported
      if (command.id === 'sheet.operation.set-cell-edit-visible') {
        // mock dbclick event
        if (command.params.eventType === DeviceInputEventType.Dblclick) {
          dbClickTime = Date.now();

          onDbClick?.();
        }
      }
    });

    return () => {
      destroyUniver();
    };
  }, [data, onClick, onDbClick]);

  return <div ref={containerRef} className="univer-container"></div>;
});

export default UniverSheet;
