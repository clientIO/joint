import { shallow } from '../shallow'

describe('shallow', () => {
  it('should return true for identical objects', () => {
    const object1 = { a: 1, b: 2 }
    const object2 = { a: 1, b: 2 }
    expect(shallow(object1, object2)).toBe(true)
  })
  it('should return false for different objects', () => {
    const object1 = { a: 1, b: 2 }
    const object2 = { a: 1, b: 3 }
    expect(shallow(object1, object2)).toBe(false)
  })
  it('should return false for different objects', () => {
    const items1 = [1, 2, 3]
    const items2 = [1, 2, 3]
    expect(shallow(items1, items2)).toBe(true)

    const items3 = [1, 2, 3]
    const items4 = [1, 2, 4]
    expect(shallow(items3, items4)).toBe(false)
  })
  it('should return true for object arrays', () => {
    const items1 = [{ a: 1 }, { b: 2 }]
    const items2 = [{ a: 1 }, { b: 2 }]
    expect(shallow(items1, items2)).toBe(true)
  })
  it('should return false for object arrays', () => {
    const items1 = [{ a: 1 }, { b: 2 }]
    const items2 = [{ a: 1 }, { b: 3 }]
    expect(shallow(items1, items2)).toBe(false)
  })
  it('should return false for objects with different keys', () => {
    const object1 = { a: 1, b: 2 }
    const object2 = { a: 1, c: 2 }
    expect(shallow(object1, object2)).toBe(false)
  })
  it('should return true for identical nested objects', () => {
    const object1 = { a: { b: 1 }, c: 2 }
    const object2 = { a: { b: 1 }, c: 2 }
    expect(shallow(object1, object2)).toBe(true)
  })
  it('should return false for different nested objects', () => {
    const object1 = { a: { b: 1 }, c: 2 }
    const object2 = { a: { b: 2 }, c: 2 }
    expect(shallow(object1, object2)).toBe(false)
  })
  it('should return true for identical dates', () => {
    const date1 = new Date(2021, 1, 1)
    const date2 = new Date(2021, 1, 1)
    expect(shallow(date1, date2)).toBe(true)
  })
  it('should return false for different dates', () => {
    const date1 = new Date(2021, 1, 1)
    const date2 = new Date(2022, 1, 1)
    expect(shallow(date1, date2)).toBe(false)
  })
  it('should return true for identical primitive values', () => {
    expect(shallow(1, 1)).toBe(true)
    expect(shallow('test', 'test')).toBe(true)
  })
  it("should compare deep objects' keys", () => {
    const item1 = {
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      id: 'b3575fc7-481d-4662-a51e-cbbbf2968e58',
    }
    const item2 = {
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      id: 'b3575fc7-481d-4662-a51e-cbbbf2968e58',
    }
    expect(shallow(item1, item2)).toBe(true)

    const item3 = {
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      id: 'b3575fc7-481d-4662-a51e-cbbbf2968e58',
    }
    const item4 = {
      position: { x: 0, y: 0 },
      size: { width: 1, height: 1 },
      angle: 0,
      id: 'b3575fc7-481d-4662-a51e-cbbbf2968e59',
    }
    expect(shallow(item3, item4)).toBe(false)
  })
  it('should return false for different primitive values', () => {
    expect(shallow(1, 2)).toBe(false)
    expect(shallow('test', 'diff')).toBe(false)
  })
})
