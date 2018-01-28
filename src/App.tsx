import * as React from 'react';

import { AIBot } from './ai/ai-bot';
import { Population } from './ai/population';
import { FieldComponent, UIMode } from './Field';
import { Field } from './game/game';

import './App.css';

export type onShipCrash = (score: number, movements: number) => void;
export type onFieldChange = (field: Field) => void;

export interface BotResults {
  score: number;
  movements: number;
  bot: AIBot;
}

class App extends React.Component<{}, {population: Array<AIBot>, bestScore: number}> {
  private populationSize = 10;
  private winnersSize = 3;
  private tick = 200; // 50 || 200 || 500 || 1000
  private startDelay = 15;
  private gameWidth = 12;
  private gameHeight = 10;
  private populationNumber = 0;
  private uiMode = UIMode.Advanced;
  private population: Population;
  private currentPopulationResults: Array<BotResults> = [];

  constructor(props: {}) {
    super(props);
    this.population = new Population(this.populationSize, this.winnersSize);
    this.state = {population: this.population.generateFirstPopulation(), bestScore: 0};
  }

  render() {
    return (
      <div className="App">
        {
          this.state.population.map((bot, index) => {
            return (
              <FieldComponent 
                key={index + this.populationSize * this.populationNumber}
                width={this.gameWidth}
                height={this.gameHeight}
                startDelay={this.startDelay}
                tick={this.tick}
                bot={bot}
                uiMode={this.uiMode}
                onGameFinished={this.onBotCrash}
              />
            );
          })
        }
        <h3>Info</h3>
        <div>best score: {this.state.bestScore}</div>
        <div>poulation #{this.populationNumber}</div>
        <h3>Settings<small>(will be applied from the next round)</small></h3>
        <div>
          game time interval: 
          <select onChange={(event) => this.changeSpeed(event.target.value)} defaultValue={this.tick.toString()}>
            <option value="50">50ms(only for simple ui mode)</option> 
            <option value="200">200ms</option>
            <option value="500">500ms</option>
            <option value="1000">1s</option>
          </select>
        </div>
        <div>
          UI mode:
          <select onChange={(event) => this.changeUIMode(event.target.value)} defaultValue="advanced">
            <option value="simple">simple</option> 
            <option value="advanced">advanced</option>
          </select>
        </div>
      </div>
    );
  }

  private changeUIMode(mode: string) {
    let parsedMode: UIMode;

    switch (mode) {
      case 'simple':
        parsedMode = UIMode.Simple;
        break;
      case 'advanced':
        parsedMode = UIMode.Advanced;
        break;
      default:
        parsedMode = UIMode.Advanced;
    }
    this.uiMode = parsedMode;
  }

  private changeSpeed(newSpeed: string) {
    this.tick = parseInt(newSpeed, 10);
  }

  private onBotCrash = (score: number, movements: number, bot: AIBot) => {
    this.currentPopulationResults.push({score, movements, bot});
    let bestScore = this.state.bestScore;
    
    if (this.state.bestScore < score) {
      bestScore = score;
    }

    if (this.currentPopulationResults.length === this.populationSize) {
      // debugger;
      this.populationNumber++;
      const nextPopulation = this.population.generateNextPopulation(this.currentPopulationResults);
      this.setState({population: nextPopulation, bestScore: bestScore});
      this.currentPopulationResults = [];
    }
  }
}

export default App;
