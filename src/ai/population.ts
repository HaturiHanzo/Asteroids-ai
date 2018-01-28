import { AIBot } from './ai-bot';
import { BotResults } from '../App';

export interface ExtendedBotInfo {
    score: number;
    bot: AIBot;
    vitalityChance: number;
}

export class Population {
    private populationSize: number;
    private winnersSize: number;

    constructor(populationSize: number, winnersSize: number) {
        this.populationSize = populationSize;
        this.winnersSize = winnersSize;
    }

    generateFirstPopulation(): Array<AIBot> {
        const population = [];

        for (let i = 0; i < this.populationSize; i++) {
            population.push(AIBot.createBot());
        }

        return population;
    }

    generateNextPopulation(previousPopulationResult: Array<BotResults>): Array<AIBot> {
        const newPopulation: Array<AIBot> = [];
        const extendedBotsInfo = this.createSelectionChancesArray(previousPopulationResult.sort((a, b) => {
            return a.score < b.score ? -1 : 1;
        }));

        const rouletteSectors = this.generateRouletteSectors(extendedBotsInfo);

        for (let i = 0; i < this.winnersSize; i++) {
            newPopulation.push(extendedBotsInfo[i].bot);
        }

        for (let i = this.winnersSize; i < this.populationSize - 3; i++) {
            const parentAIndex = this.selectSector(rouletteSectors);
            let parentBIndex = this.selectSector(rouletteSectors);
            while (parentAIndex === parentBIndex) {
                parentBIndex = this.selectSector(rouletteSectors);
            }

            newPopulation.push(extendedBotsInfo[parentAIndex].bot.crossOver(extendedBotsInfo[parentBIndex].bot));
        }

        // Cross over of 2 best in current population
        newPopulation.push(extendedBotsInfo[0].bot.crossOver(extendedBotsInfo[1].bot));

        // Extra winner
        newPopulation.push(extendedBotsInfo[0].bot);

        // Random new bot?
        newPopulation.push(AIBot.createBot());

        return newPopulation.map(bot => bot.mutate());
    }

    // Selects random sector from roulette sectors field
    private selectSector(rouletteSectors: Array<[number, number]>): number {
        const maxNumber = rouletteSectors[rouletteSectors.length - 1][1];
        const randomNumber = Math.random() * maxNumber;

        for (let i = 0; i < rouletteSectors.length; i++) {
            if (randomNumber >= rouletteSectors[i][0] && randomNumber <= rouletteSectors[i][1]) {
                return i;
            }
        }

        return 0;
    }

    // Generates roulette probability field
    private generateRouletteSectors(extendedBotsInfo: Array<ExtendedBotInfo>): Array<[number, number]> {
        return extendedBotsInfo.reduce<Array<[number, number]>>(
            (result, item) => {
                if (result.length) {
                    const prevVal = result[result.length - 1][1];
                    result.push([prevVal, prevVal + item.vitalityChance]);
                } else {
                    result.push([0, item.vitalityChance]);
                }

                return result;
            },
            []
        );
    }

    private createSelectionChancesArray(botsInfo: Array<BotResults>): Array<ExtendedBotInfo> {
        const sumScore = botsInfo.reduce(
            (result, item) => result += item.score,
            0
        );

        return botsInfo.map((botInfo) => ({
            score: botInfo.score,
            bot: botInfo.bot,
            vitalityChance: (botInfo.score / sumScore) * 100
        }));
    }
}
