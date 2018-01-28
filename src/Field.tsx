import * as React from 'react';

import { Game, ShipInfo, FieldType, Field } from './game/game';
import { AIBot } from './ai/ai-bot';

export enum UIMode {
  Simple,
  Advanced
}

export interface FieldProps {
  width: number;
  height: number;
  startDelay: number;
  tick: number;
  bot: AIBot;
  onGameFinished: (score: number, movements: number, bot: AIBot) => void;
  uiMode: UIMode;
}

interface FieldState {
  finalScore: number;
  shipInfo: ShipInfo;
}

export class FieldComponent extends React.Component<FieldProps, FieldState> {
  private timeDisposer: () => void;
  private game: Game;
  private field: HTMLDivElement;
  private animationFrameRequest: number;

  constructor(props: FieldProps) {
    super(props);

    this.state = {
      finalScore: 0,
      shipInfo: {
        firstBlockOffset: 0,
        longestSpaceOffset: 0,
        firstBlockWidth: 0
      }
    };
  }

  componentDidMount() {

    let intervalId: number; 
    let timeoutId: number;

    this.game = new Game(
      this.props.width,
      this.props.height,
      this.props.tick,
      this.props.startDelay,
      this.onFieldChanged.bind(this),
      this.onShipCrash.bind(this)
    );

    this.game.start();

    timeoutId = window.setTimeout(
        () => {
          intervalId = window.setInterval(
                () => {
                  const desision = this.props.bot.makeDesision(this.game.getShipInfo());
          
                  this.game.moveShip(desision);
                }, 
                this.props.tick / 4
            );
        }, 
        this.props.startDelay
    );

    this.timeDisposer = () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }

  componentWillUnmount() {
    this.timeDisposer();
    window.cancelAnimationFrame(this.animationFrameRequest);
  }

  render() {
    return (
      <div className="field">
        <div ref={(element) => element && (this.field = element)} />
        <span>score: {this.state.finalScore}</span>
        {/* <span>{JSON.stringify(this.state.shipInfo)}</span> */}
      </div>

    );
  }

  private onShipCrash(score: number, movements: number) {
    this.timeDisposer();
    window.cancelAnimationFrame(this.animationFrameRequest);
    this.setState({finalScore: score, shipInfo: this.game.getShipInfo()});
    this.props.onGameFinished(score, movements, this.props.bot);
  }

  private onFieldChanged(field: Field) {
    this.animationFrameRequest = window.requestAnimationFrame(() => {
      this.field.innerHTML = this.prepareHTMLView(field);
    });
    
    if (this.game) {
      this.setState({shipInfo: this.game.getShipInfo()});
    }
  }

  private prepareHTMLView(field: Field): string {
    let result = '';

    field.forEach((row: Array<FieldType>) => {
        row.forEach((el: FieldType) => result += this.renderFieldType(el));
        result += '<br>';
    });

    return result;
  }

  private renderFieldType(fieldType: FieldType): string {
    if (this.props.uiMode === UIMode.Advanced) {
      switch (fieldType) {
        case FieldType.Block:
          return '<span class="field-element_block">&#9660;</span>';
        case FieldType.Ship:
          return '<span class="field-element_ship">&#9650;</span>';
        case FieldType.Wall:
          return '<span class="field-element_wall">&#9660;</span>';
        case FieldType.Space:
          return '<span class="field-element_space">&#9660;</span>';
        default:
          return '0';
      }
    } else {
      switch (fieldType) {
        case FieldType.Block:
          return 'a';
        case FieldType.Ship:
          return 's';
        case FieldType.Wall:
          return 'w';
        case FieldType.Space:
          return '_';
        default:
          return '0';
      }
    }
  }  
}
