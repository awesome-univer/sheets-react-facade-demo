import { useEffect, useRef, useState } from 'react';
import UniverSheet from './components/UniverSheet';
import { getDefaultWorkbookData } from './assets/default-workbook-data';
import { FUniver } from '@univerjs/facade';
import {
  SetWorksheetColWidthMutation,
  SetWorksheetRowHeightMutation,
} from '@univerjs/sheets';

function App() {
  const [data, setData] = useState(() => getDefaultWorkbookData());
  const univerRef = useRef();

  useEffect(() => {
    /** @type { FUniver} */
    const univerAPI = univerRef.current.univerAPI.current;

    const { dispose } = univerAPI.onCommandExecuted((command) => {
      [command]
        .filter(
          // 按类型过滤，白名单显示
          (cmd) =>
            [
              // see https://univer.ai/guides/architecture/architecture/#%E5%91%BD%E4%BB%A4%E7%B3%BB%E7%BB%9F
              0, //命令
              1, //操作
              2, //变更
            ].indexOf(cmd.type) !== -1
        )
        .filter(
          // 按名称过滤，黑名单不显示
          (cmd) =>
            ![
              /^doc./, //文档
              /^formula-ui./, //公式栏
              /formula/, // 公式
              /set-selections/, //选区
              /set-activate-cell-edit/, //单元格编辑
              // /set-cell-edit-visible/, //单元格悬浮编辑框显示、隐藏
            ].find((rule) => {
              if (rule instanceof RegExp) {
                return rule.test(cmd.id);
              } else {
                return rule === cmd.id;
              }
            })
        )
        .map((cmd) => console.log('Command:', cmd.id, 'Params:', cmd.params));
    });

    return () => {
      dispose();
    };
  }, []);

  // add演示
  const increment = () => {
    /** @type { FUniver} */
    const univerAPI = univerRef.current?.univerAPI?.current;
    if (!univerAPI) throw Error('univerAPI undone');
    const range = univerAPI.getActiveWorkbook().getActiveSheet().getRange(0, 0);
    const oldVal = isNaN(Number(range.getValue()))
      ? 0
      : Number(range.getValue());
    range.setValue(oldVal + 1);
  };

  const logSelection = () => {
    /** @type { FUniver} */
    const univerAPI = univerRef.current?.univerAPI?.current;
    if (!univerAPI) throw Error('univerAPI undone');
    const selection = univerAPI
      .getActiveWorkbook()
      .getActiveSheet()
      .getSelection();
    const range = selection.getActiveRange();
    console.log(
      '当前选中',
      'x',
      range.getColumn(),
      'y',
      range.getRow(),
      '宽度',
      range.getWidth(),
      '高度',
      range.getHeight()
    );
  };

  const changeCellSize = () => {
    /** @type { FUniver} */
    const univerAPI = univerRef.current?.univerAPI?.current;
    if (!univerAPI) throw Error('univerAPI undone');

    const activeWorkbook = univerAPI.getActiveWorkbook();
    const activeSheet = activeWorkbook.getActiveSheet();

    univerAPI.executeCommand(SetWorksheetRowHeightMutation.id, {
      unitId: activeWorkbook.getId(),
      subUnitId: activeSheet._worksheet.getSheetId(), //需要增加
      ranges: [
        {
          startColumn: 1,
          endColumn: 1,
          startRow: 1,
          endRow: 1,
        },
      ],
      rowHeight: 20 + Math.ceil(Math.random() * 40),
    });

    univerAPI.executeCommand(SetWorksheetColWidthMutation.id, {
      unitId: activeWorkbook.getId(),
      subUnitId: activeSheet._worksheet.getSheetId(), //需要增加
      ranges: [
        {
          startColumn: 1,
          endColumn: 1,
          startRow: 1,
          endRow: 1,
        },
      ],
      colWidth: 20 + Math.ceil(Math.random() * 40),
    });
  };

  const reloadData = () => {
    setData(getDefaultWorkbookData(Math.random().toString()));
  };

  return (
    <div id="root">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="bar">
          <button
            onClick={() => {
              console.log(univerRef.current?.getData());
            }}
          >
            Get Data
          </button>
          <button onClick={increment}>Increment</button>
          <button onClick={changeCellSize}>changeCellSize</button>
          <button onClick={reloadData}>reloadData</button>
        </div>
        <UniverSheet
          style={{ flex: 1 }}
          ref={univerRef}
          data={data}
          onClick={() => {
            console.log('click');
            logSelection();
          }}
          onDbClick={() => {
            console.log('dbClick');
            logSelection();
          }}
        />
      </div>
    </div>
  );
}

export default App;
