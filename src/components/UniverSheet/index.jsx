import '@univerjs/design/lib/index.css';
import '@univerjs/ui/lib/index.css';
import '@univerjs/sheets-ui/lib/index.css';
import '@univerjs/sheets-formula/lib/index.css';
import './index.css';

import { Univer } from '@univerjs/core';
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
    });
    univerRef.current = univer;

    // core plugins
    univer.registerPlugin(UniverRenderEnginePlugin);
    univer.registerPlugin(UniverFormulaEnginePlugin);
    univer.registerPlugin(UniverUIPlugin, {
      container: containerRef.current,
      header: true,
      toolbar: true,
      footer: true,
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
    workbookRef.current = univer.createUniverSheet(data);

    // craete Facade API instance
    fUniverRef.current = FUniver.newAPI(univer);
  };

  /**
   * Destroy univer instance and workbook instance
   */
  const destroyUniver = () => {
    univerRef.current?.dispose();
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
      // 避免重复触发
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
        //用选取结束模拟 单击
        setTimeout(() => {
          onClickDebounce?.();
        }, 250);
      }

      //用选取结束命令模拟
      //该 command id 未导出，用字符串代替
      if (command.id === 'sheet.operation.set-cell-edit-visible') {
        //用单元格编辑器模拟 双击
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
