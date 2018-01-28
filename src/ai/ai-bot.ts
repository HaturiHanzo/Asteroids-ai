import { Architect, Network } from 'synaptic';
import { ShipMovement, ShipInfo } from '../game/game';
import { withChance } from '../utils';

export class AIBot {
    private botPerceptron: Network;

    static createBot() {
        return new AIBot(3, 6, 2);
    }

    private static createFromJSON(serializedNetwork: {}) {
        return new AIBot(0, 0, 0, serializedNetwork);
    }

    crossOver(bot: AIBot): AIBot {
        const currentBotData = this.botPerceptron.toJSON();
        const botData = bot.botPerceptron.toJSON();

        // Crosses bots biases
        // tslint:disable-next-line: no-any
        currentBotData.neurons.forEach((neuron: any, index: number) => {
            neuron.bias = withChance(50) ? neuron.bias : botData.neurons[index].bias;
        });

        return AIBot.createFromJSON(currentBotData);
    }

    mutate(): AIBot {
        const botData = this.botPerceptron.toJSON();

        // tslint:disable-next-line: no-any
        botData.neurons.forEach((neuron: any) => {
            if (withChance(20)) {
                neuron.bias *= this.getMutationCoeff();
            }
        });

        // tslint:disable-next-line: no-any
        botData.connections.forEach((connection: any) => {
            if (withChance(20)) {
                connection.weight *= this.getMutationCoeff();
            }
        });

        return AIBot.createFromJSON(botData);
    }

    makeDesision(shipPositionInfo: ShipInfo): ShipMovement {
        const {firstBlockOffset, longestSpaceOffset, firstBlockWidth} = shipPositionInfo;
        const desision = this.botPerceptron.activate(
            // TODO: review normalization(it's wrong now)
            [firstBlockOffset * 50, longestSpaceOffset * 100, firstBlockWidth * 50] 
        );

        if (desision[0] <= 0.5) {
            return ShipMovement.Straight;
        }

        return desision[1] > 0.5 ? ShipMovement.Right : ShipMovement.Left;
    }

    private getMutationCoeff() {
        return 1 + ((Math.random() - 0.5) * 3);
    }

    private constructor(
        inputLayers: number, 
        hiddenLayers: number,
        outputLayers: number, 
        // tslint:disable-next-line: no-any
        serializedNetwork?: any
    ) {
        if (serializedNetwork) {
            this.botPerceptron = Network.fromJSON(serializedNetwork);
        } else {
            this.botPerceptron = new Architect.Perceptron(inputLayers, hiddenLayers, outputLayers);
        }
    }
}
