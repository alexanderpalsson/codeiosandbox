import "babel-polyfill";
import picasso from "picasso.js";
import picassoQ from "picasso-plugin-q";
const enigma = require("enigma.js");
const schema = require("enigma.js/schemas/3.2.json");
const randApp = (async () => {
  //Objective config
  const barChartObject = {
    qInfo: {
      qType: "measure",
      qId: "barChartExample"
    },
    type: "my-picasso-barChart",
    qHyperCubeDef: {
      qDimensions: [
        {
          labels: true,
          qDef: {
            qFieldDefs: ["Rating"],
            qSortCriterias: [
              {
                qSortByAscii: 1
              }
            ]
          }
        }
      ],
      qMeasures: [
        {
          labels: true,
          qDef: {
            qLabel: "Votes",
            qDef: "Votes",
            autoSort: true
          }
        }
      ],
      qInitialDataFetch: [
        {
          qHeight: 15,
          qWidth: 2
        }
      ]
    }
  };

  try {
    console.log("Creating session app on engine.");
    const session = enigma.create({
      schema,
      url: `ws://localhost:9076/app/enginedata/identity/${Date.now()}`,
      createSocket: url => new WebSocket(url)
    });
    const qix = await session.open();
    const app = await qix.createSessionApp();

    //Inlined data
    const script = `Stars:
        LOAD * INLINE 
        [
        Rating,Votes,
        10,3404,
        9,2234,
        8,6243,
        7,13785,
        6,20325,
        5,18046,
        4,10179,
        3,5844,
        2,3244,
        1,3208
        ];`;
    await app.setScript(script);
    await app.doReload();

    //Create objectives
    const object = await app.createSessionObject(barChartObject);
    const layout = await object.getLayout();

    //Configure picasso chart settings
    const chartSettings = {
      scales: {
        labels: "true",
        y: {
          data: { field: "Votes" },
          invert: true,
          include: [0]
        },

        t: { data: { extract: { field: "Rating" } }, padding: 0.3 }
      },
      components: [
        {
          type: "axis",
          dock: "left",
          scale: "y"
        },
        {
          type: "axis",
          dock: "bottom",
          scale: "t"
        },
        {
          key: "bars",
          type: "box",
          data: {
            extract: {
              field: "Rating",
              props: {
                start: 0,
                end: { field: "Votes" }
              }
            }
          },
          settings: {
            major: { scale: "t" },
            minor: { scale: "y" }
          }
        },
        {
          type: "text",
          text: "Rating Score",
          layout: {
            dock: "bottom"
          }
        },
        {
          type: "text",
          text: "Number of Votes",
          layout: {
            dock: "left"
          }
        }
      ]
    };
    //Picasso.js q plugin for assisting loading of QIX objects
    picasso.use(picassoQ);

    await picassoPaint(chartSettings, layout);
  } catch (err) {
    console.log("Whoops! An error occurred.", err);
    process.exit(1);
  }
})();

// Paint the chart
function picassoPaint(settings, layout) {
  picasso.chart({
    element: document.querySelector("#container"), // This is the element to render the chart in
    data: [
      {
        type: "q",
        key: "qHyperCube",
        data: layout.qHyperCube
      }
    ],
    settings
  });
}
